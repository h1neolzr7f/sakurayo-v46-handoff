#!/usr/bin/env python3
"""Chroma-key newly generated enemy _b frames and swordmaster faces."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
KEYER = Path.home() / ".codex" / "skills" / ".system" / "imagegen" / "scripts" / "remove_chroma_key.py"
GEN = (
    Path.home()
    / ".cursor"
    / "projects"
    / "c-Users-tzzcomputer-Documents-Codex-2026-07-10-new-chat-6-work-v423-delivery-source"
    / "assets"
)
ANDROID = ROOT / "android-app" / "app" / "src" / "main" / "assets" / "game" / "art"
OFFLINE = ROOT.parent / "offline" / "game" / "art"
KEEP = ROOT / "assets" / "image2" / "source"

JOBS = [
    ("sakurayo-enemy-elite-b.png", "enemies/elite_b.webp", 512, 16),
    ("sakurayo-enemy-fast-b.png", "enemies/fast_b.webp", 512, 16),
    ("sakurayo-enemy-disruptor-b.png", "enemies/disruptor_b.webp", 512, 16),
    ("sakurayo-enemy-specter-b.png", "enemies/specter_b.webp", 512, 16),
    ("sakurayo-enemy-pethunter-b.png", "enemies/pethunter_b.webp", 512, 16),
    ("sakurayo-enemy-noisecaller-b.png", "enemies/noisecaller_b.webp", 512, 16),
    ("sakurayo-enemy-souleater-b.png", "enemies/souleater_b.webp", 512, 16),
    ("sakurayo-enemy-mirrorblade-b.png", "enemies/mirrorblade_b.webp", 512, 16),
    ("sakurayo-npc-swordmaster-face-calm.png", "npc/swordmaster/face_calm.webp", 512, 20),
    ("sakurayo-npc-swordmaster-face-serious.png", "npc/swordmaster/face_serious.webp", 512, 20),
    ("sakurayo-npc-swordmaster-face-smile.png", "npc/swordmaster/face_smile.webp", 512, 20),
    ("sakurayo-npc-swordmaster-face-surprised.png", "npc/swordmaster/face_surprised.webp", 512, 20),
]


def chroma(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(
        [
            sys.executable,
            str(KEYER),
            "--input",
            str(src),
            "--out",
            str(dst),
            "--auto-key",
            "corners",
            "--soft-matte",
            "--spill-cleanup",
            "--tolerance",
            "48",
            "--force",
        ]
    )


def fit(src: Path, size: int, pad: int) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit(f"empty alpha: {src}")
    crop = im.crop(bbox)
    crop.thumbnail((max(1, size - pad * 2), max(1, size - pad * 2)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(crop, ((size - crop.width) // 2, (size - crop.height) // 2))
    return canvas


def save_all(canvas: Image.Image, rel: str) -> None:
    for root in (ANDROID, OFFLINE, KEEP):
        out = root / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(out, "WEBP", quality=88, method=6)
        print(f"wrote {out} {out.stat().st_size}")


def sync_offline() -> int:
    copied = 0
    for src in ANDROID.rglob("*"):
        if not src.is_file():
            continue
        rel = src.relative_to(ANDROID)
        dst = OFFLINE / rel
        if not dst.exists() or dst.stat().st_size != src.stat().st_size:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            copied += 1
    return copied


def main() -> None:
    tmp = KEEP / "generated_keyed"
    tmp.mkdir(parents=True, exist_ok=True)
    for name, rel, size, pad in JOBS:
        src = GEN / name
        if not src.exists():
            print(f"skip missing {name}")
            continue
        keyed = tmp / f"{src.stem}.png"
        chroma(src, keyed)
        canvas = fit(keyed, size, pad)
        corners = [canvas.getpixel(p)[3] for p in ((0, 0), (size - 1, 0), (0, size - 1), (size - 1, size - 1))]
        if max(corners) > 8:
            print(f"warning non-transparent corners {rel}: {corners}")
        save_all(canvas, rel)
    copied = sync_offline()
    print(f"offline synced {copied} files")


if __name__ == "__main__":
    main()
