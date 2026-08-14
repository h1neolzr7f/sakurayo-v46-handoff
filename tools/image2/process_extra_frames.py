#!/usr/bin/env python3
"""Chroma-key extra combat poses and FX follow-through frames into game art."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from PIL import Image
import argparse

ROOT = Path(__file__).resolve().parents[2]
KEYER = Path.home() / ".codex" / "skills" / ".system" / "imagegen" / "scripts" / "remove_chroma_key.py"
GEN_DIRS = [
    Path.home()
    / ".cursor"
    / "projects"
    / "c-Users-tzzcomputer-Documents-Codex-2026-07-10-new-chat-6-work-v423-delivery-source"
    / "assets",
    ROOT / "assets",
]
ANDROID = ROOT / "android-app" / "app" / "src" / "main" / "assets" / "game" / "art"
OFFLINE = ROOT.parent / "offline" / "game" / "art"
KEEP = ROOT / "assets" / "image2" / "source"


def find_src(name: str) -> Path | None:
    for folder in GEN_DIRS:
        path = folder / name
        if path.exists():
            return path
    return None


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
    parser.add_argument("--skip-existing", action="store_true")
    args = parser.parse_args()
    jobs = []
    for cid in ("sayo", "aya", "rion"):
        for pose in ("idle-c", "move-b", "attack-c", "skill-b", "dash-b", "hit-b"):
            jobs.append((f"sakurayo-{cid}-{pose}.png", f"characters/{cid}/default/anim_{pose.replace('-', '_')}.webp", 512, 16))
    for kind in ("slash", "muzzle", "hit", "skill", "dash", "loot", "shatter", "levelup"):
        jobs.append((f"sakurayo-fx-{kind}-b.png", f"fx/{kind}_b.webp", 512, 24))
    for kind in ("normal", "fast", "tank", "ranged", "bomb", "shield", "disruptor", "purifier", "specter", "decay", "seal", "elite", "pethunter", "noisecaller", "souleater", "mirrorblade"):
        jobs.append((f"sakurayo-enemy-{kind}-b.png", f"enemies/{kind}_b.webp", 512, 16))
    for kind in ("drone", "bat", "familiar", "wisp"):
        jobs.append((f"sakurayo-pet-{kind}.png", f"pets/{kind}.webp", 384, 20))
        jobs.append((f"sakurayo-pet-{kind}-b.png", f"pets/{kind}_b.webp", 384, 20))
    tmp = KEEP / "generated_keyed"
    tmp.mkdir(parents=True, exist_ok=True)
    for name, rel, size, pad in jobs:
        src = find_src(name)
        if src is None:
            print(f"skip missing {name}")
            continue
        if args.skip_existing and (ANDROID / rel).exists():
            print(f"skip exists {rel}")
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
