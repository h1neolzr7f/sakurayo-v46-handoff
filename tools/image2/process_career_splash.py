#!/usr/bin/env python3
"""Resize career/fusion splash PNGs to 1024x576 WebP. No chroma key — full scene art."""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
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
NAME_RE = re.compile(r"^(career|fusion)-([A-Za-z]+)-splash\.png$")
BRANCH_CASE = {
    "swordsaint": "swordSaint",
    "raillord": "railLord",
    "plaguedoctor": "plagueDoctor",
    "bloodduke": "bloodDuke",
    "batqueen": "batQueen",
    "staridol": "starIdol",
    "thunderlord": "thunderLord",
    "timemage": "timeMage",
    "bombninja": "bombNinja",
    "warsinger": "warSinger",
    "healingidol": "healingIdol",
    "boneking": "boneKing",
    "soulherd": "soulHerd",
}


def branch_id(raw: str) -> str:
    return BRANCH_CASE.get(raw.lower(), raw[0].lower() + raw[1:] if raw[:1].isupper() else raw)


def fit_cover(src: Path, size: tuple[int, int] = (1024, 576)) -> Image.Image:
    im = Image.open(src).convert("RGB")
    tw, th = size
    scale = max(tw / im.width, th / im.height)
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    if not GEN.is_dir():
        print("no gen folder")
        return 0
    count = skipped = 0
    for src in sorted(list(GEN.glob("career-*-splash.png")) + list(GEN.glob("fusion-*-splash.png"))):
        match = NAME_RE.match(src.name)
        if not match:
            continue
        kind, raw = match.group(1), match.group(2)
        bid = branch_id(raw) if kind == "career" else raw[0].lower() + raw[1:] if raw[:1].isupper() else raw.lower()
        rel = f"{'careers' if kind == 'career' else 'fusions'}/{bid}/splash.webp"
        dest = ANDROID / rel
        if dest.is_file() and not args.force:
            skipped += 1
            continue
        canvas = fit_cover(src)
        for root in (ANDROID, OFFLINE, KEEP):
            out = root / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            canvas.save(out, "WEBP", quality=88, method=6)
            print(f"wrote {out} {out.stat().st_size}")
        count += 1
    print(f"OK {count} splash, skipped {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
