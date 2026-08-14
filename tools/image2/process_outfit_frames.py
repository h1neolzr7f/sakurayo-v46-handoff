#!/usr/bin/env python3
"""Chroma-key career/form combat outfits into 512 WebP sprites.

Discovers `{char}-career-{branch}-{pose}.png`, `{char}-form-{id}-{pose}.png`
and `{char}-fusion-{id}-{pose}.png` in the Cursor assets folder. Missing
sources are skipped. Existing WebPs are kept unless --force is set.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
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
KEEP = ROOT / "assets" / "image2" / "source" / "outfits"

CHARS = ("sayo", "aya", "rion")
POSES = ("idle", "move", "attack", "skill", "dash")
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
NAME_RE = re.compile(
    r"^(sayo|aya|rion)-(career|form|fusion)-([A-Za-z]+)-(idle|move|attack|skill|dash)\.png$",
    re.I,
)


def folder_id(kind: str, raw: str) -> str:
    key = raw.lower()
    name = BRANCH_CASE.get(key, raw[0].lower() + raw[1:] if raw[:1].isupper() else raw)
    if kind == "form":
        return f"form_{name.lower()}"
    if kind == "fusion":
        return f"fusion_{name.lower()}"
    return f"career_{name}"


def chroma_fast(src: Path) -> Image.Image:
    """Vectorized #00FF00 key with soft matte and green-spill cleanup."""
    im = Image.open(src).convert("RGBA")
    arr = np.asarray(im).astype(np.int16)
    rgb = arr[:, :, :3]
    src_a = arr[:, :, 3]
    key = np.array([0, 255, 0], dtype=np.int16)
    dist = np.max(np.abs(rgb - key), axis=2)
    g = rgb[:, :, 1]
    rb = np.maximum(rgb[:, :, 0], rgb[:, :, 2])
    dominance = g - rb
    t0, t1 = 18.0, 72.0
    soft = np.clip((dist.astype(np.float32) - t0) / (t1 - t0), 0, 1)
    soft = soft * soft * (3.0 - 2.0 * soft)
    dom = np.clip(1.0 - np.clip(dominance.astype(np.float32) / 220.0, 0, 1), 0, 1)
    alpha = np.minimum(soft, dom) * (src_a.astype(np.float32) / 255.0)
    alpha = (alpha * 255.0).astype(np.int16)
    alpha[alpha <= 8] = 0
    out = arr.copy()
    spill = dominance >= 16
    cap = np.maximum(rb - 1, 0)
    out[:, :, 1] = np.where(spill & (alpha < 252), np.minimum(out[:, :, 1], cap), out[:, :, 1])
    out[:, :, 3] = alpha
    out[alpha == 0] = 0
    return Image.fromarray(out.astype(np.uint8), "RGBA")


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


def fit(src: Path | Image.Image, size: int = 512, pad: int = 18) -> Image.Image:
    im = src.convert("RGBA") if isinstance(src, Image.Image) else Image.open(src).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit(f"empty alpha: {src}")
    crop = im.crop(bbox)
    crop.thumbnail((max(1, size - pad * 2), max(1, size - pad * 2)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(crop, ((size - crop.width) // 2, (size - crop.height) // 2))
    return canvas


def save_all(canvas: Image.Image, rel: str) -> None:
    blob = None
    for root in (ANDROID, OFFLINE, KEEP):
        out = root / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        if blob is None:
            buf = __import__("io").BytesIO()
            canvas.save(buf, "WEBP", quality=84, method=4)
            blob = buf.getvalue()
        out.write_bytes(blob)
        print(f"wrote {out} {len(blob)}")


def discover(prefix: str | None) -> list[tuple[Path, str, str, str]]:
    jobs = []
    if not GEN.is_dir():
        return jobs
    for src in sorted(GEN.glob("*.png")):
        match = NAME_RE.match(src.name)
        if not match:
            continue
        char, kind, raw, pose = match.groups()
        char = char.lower()
        pose = pose.lower()
        folder = folder_id(kind.lower(), raw)
        if prefix and f"{char}/{folder}" != prefix and folder != prefix and char != prefix and kind.lower() != prefix and not folder.startswith(prefix + "_"):
            continue
        jobs.append((src, char, folder, pose))
    return jobs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--slow-keyer", action="store_true")
    parser.add_argument("--only", default="", help="char, folder, or char/folder")
    args = parser.parse_args()
    if args.slow_keyer and not KEYER.is_file():
        raise SystemExit(f"missing keyer: {KEYER}")
    tmp = ROOT / "tests" / "artifacts" / "outfit-key"
    tmp.mkdir(parents=True, exist_ok=True)
    jobs = discover(args.only or None)
    if not jobs:
        print("no outfit sources found")
        return 0
    count = 0
    skipped = 0
    for src, char, folder, pose in jobs:
        rel = f"characters/{char}/{folder}/anim_{pose}.webp"
        dest = ANDROID / rel
        if dest.is_file() and not args.force:
            skipped += 1
            continue
        if args.slow_keyer:
            keyed = tmp / f"{char}-{folder}-{pose}.png"
            chroma(src, keyed)
            canvas = fit(keyed)
        else:
            canvas = fit(chroma_fast(src))
        save_all(canvas, rel)
        count += 1
        print(f"ok {rel}")
    print(f"OK {count} outfit frames, skipped {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
