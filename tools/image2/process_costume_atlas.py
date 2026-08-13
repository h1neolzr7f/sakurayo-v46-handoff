from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

from process_costume_sheet import NAMES, fitted_cell, remove_green, remove_small_islands, trim_to_key_band


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--skin", required=True)
    parser.add_argument("--asset-root", type=Path, default=Path("android-app/app/src/main/assets/game/art"))
    parser.add_argument("--preview-root", type=Path, default=Path("assets/image2/previews/costumes"))
    args = parser.parse_args()
    atlas = Image.open(args.input).convert("RGBA")
    args.preview_root.mkdir(parents=True, exist_ok=True)
    for row_index, character in enumerate(("sayo", "aya", "rion")):
        top = round(row_index * atlas.height / 3)
        bottom = round((row_index + 1) * atlas.height / 3)
        source = trim_to_key_band(atlas.crop((0, top, atlas.width, bottom)))
        keyed = remove_green(source)
        out_dir = args.asset_root / "characters" / character / args.skin
        out_dir.mkdir(parents=True, exist_ok=True)
        cells = []
        for index, name in enumerate(NAMES):
            left = round(index * source.width / len(NAMES))
            right = round((index + 1) * source.width / len(NAMES))
            inset_x = max(3, round((right - left) * .012))
            inset_y = max(3, round(source.height * .012))
            cell = remove_small_islands(fitted_cell(keyed.crop((left + inset_x, inset_y, right - inset_x, source.height - inset_y))))
            # Method 3 keeps the 512 px sprites visually lossless at phone scale
            # while avoiding multi-minute atlas exports from Pillow's method 6.
            cell.save(out_dir / f"{name}.webp", "WEBP", quality=92, method=3)
            cells.append(cell)
        preview = Image.new("RGBA", (7 * 260, 300), (14, 11, 28, 255))
        draw = ImageDraw.Draw(preview)
        for index, (name, cell) in enumerate(zip(NAMES, cells)):
            preview.alpha_composite(cell.resize((240, 240), Image.Resampling.LANCZOS), (index * 260 + 10, 8))
            draw.text((index * 260 + 10, 258), name, fill=(245, 225, 240, 255))
        preview.convert("RGB").save(args.preview_root / f"{character}_{args.skin}.png", quality=94)
        print(f"processed {character}/{args.skin}")


if __name__ == "__main__":
    main()
