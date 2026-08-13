from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--skin", required=True)
    parser.add_argument("--out-dir", type=Path, default=Path("assets/image2/processed/costume_rows"))
    args = parser.parse_args()
    image = Image.open(args.input).convert("RGBA")
    args.out_dir.mkdir(parents=True, exist_ok=True)
    for index, character in enumerate(("sayo", "aya", "rion")):
        top = round(index * image.height / 3)
        bottom = round((index + 1) * image.height / 3)
        row = image.crop((0, top, image.width, bottom))
        target = args.out_dir / f"{args.skin}_{character}.png"
        row.save(target)
        print(target)


if __name__ == "__main__":
    main()
