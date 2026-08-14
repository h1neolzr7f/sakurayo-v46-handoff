#!/usr/bin/env python3
"""Build looping homepage idle WebP from dialogue + matching blink frames."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ANDROID = ROOT / "android-app" / "app" / "src" / "main" / "assets" / "game" / "art"
OFFLINE = ROOT.parent / "offline" / "game" / "art"
CHARS = ("sayo", "aya", "rion")
SIZE = 512


def load_square(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 255))
    fitted = im.copy()
    fitted.thumbnail((SIZE, SIZE), Image.Resampling.LANCZOS)
    canvas.alpha_composite(fitted, ((SIZE - fitted.width) // 2, SIZE - fitted.height))
    return canvas


def save_anim(frames: list[Image.Image], durations: list[int], rel: str) -> None:
    for root in (ANDROID, OFFLINE):
        out = root / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        frames[0].save(
            out,
            "WEBP",
            save_all=True,
            append_images=frames[1:],
            duration=durations,
            loop=0,
            quality=86,
            method=6,
        )
        print(f"wrote {out} {out.stat().st_size}")


def main() -> None:
    for cid in CHARS:
        base_dir = ANDROID / "characters" / cid / "default"
        dialogue = load_square(base_dir / "dialogue.webp")
        blink = load_square(base_dir / "live_blink.webp")
        frames = [dialogue, blink, dialogue]
        durations = [2800, 90, 160]
        save_anim(frames, durations, f"characters/{cid}/default/live_idle.webp")


if __name__ == "__main__":
    main()
