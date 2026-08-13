from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

from process_costume_sheet import fitted_cell, remove_green, remove_small_islands


ENEMIES = [
    "normal", "fast", "tank", "ranged",
    "bomb", "shield", "disruptor", "purifier",
    "specter", "decay", "seal", "elite",
]


def split_atlas(source: Path, columns: int, rows: int, names: list[str], target: Path) -> list[dict]:
    atlas = Image.open(source).convert("RGBA")
    keyed = remove_green(atlas)
    target.mkdir(parents=True, exist_ok=True)
    records = []
    for index, name in enumerate(names):
        row, column = divmod(index, columns)
        left = round(column * atlas.width / columns)
        right = round((column + 1) * atlas.width / columns)
        top = round(row * atlas.height / rows)
        bottom = round((row + 1) * atlas.height / rows)
        inset_x = max(3, round((right - left) * .015))
        inset_y = max(3, round((bottom - top) * .015))
        cell = keyed.crop((left + inset_x, top + inset_y, right - inset_x, bottom - inset_y))
        cell = remove_small_islands(fitted_cell(cell, size=512, margin=16))
        output = target / f"{name}.webp"
        cell.save(output, "WEBP", quality=92, method=3)
        alpha = cell.getchannel("A")
        coverage = sum(value > 16 for value in alpha.get_flattened_data()) / (cell.width * cell.height)
        records.append({"id": name, "path": output.as_posix(), "coverage": round(coverage, 4)})
    return records


def preview(records: list[dict], output: Path, columns: int = 4) -> None:
    rows = (len(records) + columns - 1) // columns
    canvas = Image.new("RGBA", (columns * 230, rows * 250), (12, 9, 25, 255))
    draw = ImageDraw.Draw(canvas)
    for index, record in enumerate(records):
        image = Image.open(record["path"]).convert("RGBA").resize((210, 210), Image.Resampling.LANCZOS)
        x, y = index % columns * 230 + 10, index // columns * 250 + 5
        canvas.alpha_composite(image, (x, y))
        draw.text((x, y + 214), record["id"], fill=(255, 224, 241, 255))
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output, quality=94)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--enemy", type=Path, required=True)
    parser.add_argument("--boss", type=Path, required=True)
    parser.add_argument("--asset-root", type=Path, default=Path("android-app/app/src/main/assets/game/art"))
    parser.add_argument("--preview-root", type=Path, default=Path("assets/image2/previews/v38"))
    parser.add_argument("--manifest", type=Path, default=Path("assets/image2/combat_manifest_v38.json"))
    args = parser.parse_args()

    enemy_records = split_atlas(args.enemy, 4, 3, ENEMIES, args.asset_root / "enemies")
    boss_names = [f"stage{stage}_phase{phase}" for stage in range(1, 5) for phase in range(1, 5)]
    boss_records = split_atlas(args.boss, 4, 4, boss_names, args.asset_root / "bosses")
    preview(enemy_records, args.preview_root / "enemies.png")
    preview(boss_records, args.preview_root / "bosses.png")
    payload = {"version": "3.8", "enemies": enemy_records, "bosses": boss_records}
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"enemies": len(enemy_records), "bosses": len(boss_records), "manifest": str(args.manifest)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
