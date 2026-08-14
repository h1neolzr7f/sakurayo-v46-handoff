#!/usr/bin/env python3
"""Fit homepage blink frames to 512 WebP. Hair overlays are not shipped unless they are hair-only."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ANDROID = ROOT / "android-app" / "app" / "src" / "main" / "assets" / "game" / "art"
OFFLINE = ROOT.parent / "offline" / "game" / "art"
KEEP = ROOT / "assets" / "image2" / "source"
GEN_DIRS = [
    Path.home()
    / ".cursor"
    / "projects"
    / "c-Users-tzzcomputer-Documents-Codex-2026-07-10-new-chat-6-work-v423-delivery-source"
    / "assets",
    ROOT / "assets",
]


def find_src(name: str) -> Path:
    for folder in GEN_DIRS:
        path = folder / name
        if path.exists():
            return path
    raise SystemExit(f"missing generated image: {name}")


def fit_black(src: Path) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 255))
    im.thumbnail((512, 512), Image.Resampling.LANCZOS)
    canvas.alpha_composite(im, ((512 - im.width) // 2, (512 - im.height) // 2))
    return canvas


def save_all(canvas: Image.Image, rel: str) -> None:
    for root in (ANDROID, OFFLINE, KEEP):
        out = root / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(out, "WEBP", quality=86, method=6)
        print(f"wrote {out} {out.stat().st_size}")


def main() -> None:
    for cid in ("sayo", "aya", "rion"):
        src = find_src(f"sakurayo-{cid}-live-blink.png")
        save_all(fit_black(src), f"characters/{cid}/default/live_blink.webp")


if __name__ == "__main__":
    main()
