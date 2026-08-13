from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "android-app/app/src/main/assets/game/art/ui/app_icon.webp"
RES = ROOT / "android-app/app/src/main/res"
SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Launcher source not found: {SOURCE}")
    with Image.open(SOURCE) as source:
        rgba = source.convert("RGBA")
        for folder, size in SIZES.items():
            target_dir = RES / folder
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / "ic_launcher.png"
            inset = max(1, round(size * 0.08))
            inner_size = size - inset * 2
            inner = rgba.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
            resized = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            resized.alpha_composite(inner, (inset, inset))
            resized.save(target, optimize=True)
            mask = Image.new("L", (size, size), 0)
            ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
            round_icon = resized.copy()
            round_icon.putalpha(mask)
            round_icon.save(target_dir / "ic_launcher_round.png", optimize=True)
            print(f"wrote {target} ({size}x{size})")


if __name__ == "__main__":
    main()
