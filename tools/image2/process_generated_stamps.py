#!/usr/bin/env python3
"""Chroma-key generated stamps into game art WebP files."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
KEYER = Path.home() / ".codex" / "skills" / ".system" / "imagegen" / "scripts" / "remove_chroma_key.py"
GEN = Path.home() / ".cursor" / "projects" / "e-Packages-releases-pixiv-nai-gallery-full-one-click-windows" / "assets"
ANDROID = ROOT / "android-app" / "app" / "src" / "main" / "assets" / "game" / "art"
OFFLINE = ROOT.parent / "offline" / "game" / "art"
KEEP = ROOT / "assets" / "image2" / "source"


def chroma(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
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
    subprocess.check_call(cmd)


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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kind", choices=["poses", "faces", "all"], default="all")
    args = parser.parse_args()
    jobs = []
    if args.kind in ("poses", "all"):
        for cid, poses in (
            ("sayo", ("idle-b", "attack-b", "skill")),
            ("aya", ("idle-b", "attack-b", "skill")),
            ("rion", ("idle-b", "attack-b", "skill")),
        ):
            for pose in poses:
                src = GEN / f"sakurayo-{cid}-{pose}.png"
                pose_id = pose.replace("-", "_")
                jobs.append((src, f"characters/{cid}/default/anim_{pose_id}.webp", 512, 16))
    if args.kind in ("faces", "all"):
        for cid in ("sayo", "aya", "rion"):
            for mood in ("calm", "mad", "hurt", "win"):
                src = GEN / f"sakurayo-{cid}-face-{mood}.png"
                jobs.append((src, f"characters/{cid}/default/face_{mood}.webp", 512, 12))
    tmp = KEEP / "generated_keyed"
    tmp.mkdir(parents=True, exist_ok=True)
    for src, rel, size, pad in jobs:
        if not src.exists():
            print(f"skip missing {src}")
            continue
        keyed = tmp / f"{src.stem}.png"
        chroma(src, keyed)
        canvas = fit(keyed, size, pad)
        corners = [canvas.getpixel(p)[3] for p in ((0, 0), (size - 1, 0), (0, size - 1), (size - 1, size - 1))]
        if max(corners) > 8:
            print(f"warning non-transparent corners {rel}: {corners}")
        save_all(canvas, rel)


if __name__ == "__main__":
    main()
