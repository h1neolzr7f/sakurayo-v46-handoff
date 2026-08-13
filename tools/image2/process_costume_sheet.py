from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter


NAMES = ["portrait", "dialogue", "anim_idle", "anim_move", "anim_attack", "anim_hit", "anim_dash"]


def trim_to_key_band(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    sample = rgb.resize((256, max(32, round(rgb.height * 256 / rgb.width))), Image.Resampling.BILINEAR)
    rows = []
    for y in range(sample.height):
        green = 0
        for x in range(sample.width):
            r, g, b = sample.getpixel((x, y))
            if g > 100 and g - max(r, b) > 30:
                green += 1
        if green / sample.width > .22:
            rows.append(y)
    if not rows:
        return image
    top = max(0, round(min(rows) * image.height / sample.height))
    bottom = min(image.height, round((max(rows) + 1) * image.height / sample.height))
    return image.crop((0, top, image.width, bottom))


def remove_green(image: Image.Image) -> Image.Image:
    data = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    rgb = data[..., :3].astype(np.int16)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    keyed = (green > 45) & ((green - np.maximum(red, blue)) > 6)
    data[..., 1] = np.where(keyed, np.minimum(green, np.maximum(red, blue) + 12), green).astype(np.uint8)
    data[..., 3] = np.where(keyed, 0, 255).astype(np.uint8)
    rgba = Image.fromarray(data, mode="RGBA")
    alpha = rgba.getchannel("A").filter(ImageFilter.GaussianBlur(0.45))
    rgba.putalpha(alpha)
    return rgba


def remove_white_guides(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            edge_zone = x < rgba.width * .12 or x > rgba.width * .88 or y < rgba.height * .12 or y > rgba.height * .88
            if edge_zone and min(r, g, b) > 225 and max(r, g, b) - min(r, g, b) < 18:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def remove_small_islands(image: Image.Image) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"), dtype=np.uint8)
    binary = (alpha > 16).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(binary, connectivity=4)
    if count <= 1:
        return image
    width, height = image.size
    interior: list[int] = []
    remove = np.zeros(count, dtype=bool)
    for label in range(1, count):
        x, y, w, h, _ = stats[label]
        if x < 3 or y < 3 or x + w >= width - 3 or y + h >= height - 3:
            remove[label] = True
        else:
            interior.append(label)
    if interior:
        main = max(interior, key=lambda label: int(stats[label, cv2.CC_STAT_AREA]))
        largest = int(stats[main, cv2.CC_STAT_AREA])
        keep_min = max(120, int(largest * .03))
        mx, my, mw, mh, _ = stats[main]
        main_box = (mx, my, mx + mw - 1, my + mh - 1)
        for label in interior:
            x, y, w, h, area = stats[label]
            box = (x, y, x + w - 1, y + h - 1)
            dx = max(0, main_box[0] - box[2], box[0] - main_box[2])
            dy = max(0, main_box[1] - box[3], box[1] - main_box[3])
            far_fragment = label != main and area < largest * .12 and (dx * dx + dy * dy) ** .5 > 28
            if area < keep_min or far_fragment:
                remove[label] = True
    cleaned = alpha.copy()
    cleaned[remove[labels]] = 0
    image.putalpha(Image.fromarray(cleaned, mode="L"))
    return image


def fitted_cell(cell: Image.Image, size: int = 512, margin: int = 18) -> Image.Image:
    alpha = cell.getchannel("A")
    bbox = alpha.getbbox()
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if not bbox:
        return canvas
    body = cell.crop(bbox)
    scale = min((size - margin * 2) / body.width, (size - margin * 2) / body.height)
    body = body.resize((max(1, round(body.width * scale)), max(1, round(body.height * scale))), Image.Resampling.LANCZOS)
    x = (size - body.width) // 2
    y = size - margin - body.height
    canvas.alpha_composite(body, (x, y))
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--character", required=True)
    parser.add_argument("--skin", required=True)
    parser.add_argument("--asset-root", type=Path, default=Path("android-app/app/src/main/assets/game/art"))
    parser.add_argument("--preview-root", type=Path, default=Path("assets/image2/previews/costumes"))
    parser.add_argument("--remove-white-guides", action="store_true")
    args = parser.parse_args()

    source = trim_to_key_band(Image.open(args.input).convert("RGBA"))
    keyed = remove_green(source)
    out_dir = args.asset_root / "characters" / args.character / args.skin
    out_dir.mkdir(parents=True, exist_ok=True)
    args.preview_root.mkdir(parents=True, exist_ok=True)

    cells: list[Image.Image] = []
    metrics = []
    for index, name in enumerate(NAMES):
        left = round(index * source.width / len(NAMES))
        right = round((index + 1) * source.width / len(NAMES))
        inset_x = max(3, round((right - left) * .012))
        inset_y = max(3, round(source.height * .012))
        source_cell = keyed.crop((left + inset_x, inset_y, right - inset_x, source.height - inset_y))
        if args.remove_white_guides:
            source_cell = remove_white_guides(source_cell)
        cell = remove_small_islands(fitted_cell(source_cell))
        target = out_dir / f"{name}.webp"
        cell.save(target, "WEBP", quality=92, method=3)
        coverage = sum(1 for value in cell.getchannel("A").get_flattened_data() if value > 16) / (cell.width * cell.height)
        metrics.append({"name": name, "path": target.as_posix(), "coverage": round(coverage, 4)})
        cells.append(cell)

    preview = Image.new("RGBA", (7 * 260, 300), (14, 11, 28, 255))
    draw = ImageDraw.Draw(preview)
    for i, (name, cell) in enumerate(zip(NAMES, cells)):
        thumb = cell.resize((240, 240), Image.Resampling.LANCZOS)
        preview.alpha_composite(thumb, (i * 260 + 10, 8))
        draw.text((i * 260 + 10, 258), name, fill=(245, 225, 240, 255))
    preview_path = args.preview_root / f"{args.character}_{args.skin}.png"
    preview.convert("RGB").save(preview_path, quality=94)
    print(json.dumps({"character": args.character, "skin": args.skin, "source": str(args.input), "preview": str(preview_path), "assets": metrics}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
