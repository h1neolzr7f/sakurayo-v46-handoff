#!/usr/bin/env python3
"""Chroma-key NAI stills and lock them to the existing lobby / portrait canvases."""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
ANDROID = ROOT / "android-app" / "app" / "src" / "main" / "assets" / "game" / "art"
OUT = ROOT / "outputs" / "nai"

LIVE_CANVAS = (1280, 1280)
LIVE_TOP = 30
LIVE_HEIGHT = 1220
PORTRAIT_CANVAS = (512, 512)
PORTRAIT_TOP = 12
PORTRAIT_HEIGHT = 488


def feather_alpha(im: Image.Image, radius: float = 2.2) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).copy()
    hard = arr[:, :, 3]
    soft = np.asarray(Image.fromarray(hard, "L").filter(ImageFilter.GaussianBlur(radius=radius)))
    arr[:, :, 3] = np.where(hard > 240, 255, soft)
    return Image.fromarray(arr, "RGBA")


def key_green(im: Image.Image) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).copy()
    r, g, b = arr[:, :, 0].astype(np.int16), arr[:, :, 1].astype(np.int16), arr[:, :, 2].astype(np.int16)
    mask = (g > 70) & (g > r + 24) & (g > b + 24)
    arr[:, :, 3] = np.where(mask, 0, arr[:, :, 3])
    # Despill remaining green fringe.
    fringe = (arr[:, :, 3] > 0) & (g > r + 8) & (g > b + 8)
    arr[:, :, 1] = np.where(fringe, np.minimum(arr[:, :, 1], ((r + b) // 2).astype(np.uint8)), arr[:, :, 1])
    return feather_alpha(Image.fromarray(arr, "RGBA"))


def key_flat(im: Image.Image, luma_max: int = 28) -> Image.Image:
    """Drop near-black or near-white edge-connected backdrop if greenscreen failed."""
    arr = np.asarray(im.convert("RGBA")).copy()
    h, w = arr.shape[:2]
    luma = arr[:, :, :3].max(axis=2)
    sat = arr[:, :, :3].max(axis=2).astype(np.int16) - arr[:, :, :3].min(axis=2).astype(np.int16)
    flat = ((luma <= luma_max) | (luma >= 230)) & (sat < 18)
    vis = np.zeros((h, w), dtype=bool)
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            if flat[y, x] and not vis[y, x]:
                vis[y, x] = True
                stack.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if flat[y, x] and not vis[y, x]:
                vis[y, x] = True
                stack.append((y, x))
    while stack:
        y, x = stack.pop()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not vis[ny, nx] and flat[ny, nx]:
                vis[ny, nx] = True
                stack.append((ny, nx))
    arr[:, :, 3] = np.where(vis, 0, arr[:, :, 3])
    return feather_alpha(Image.fromarray(arr, "RGBA"))


def cutout(im: Image.Image) -> Image.Image:
    keyed = key_green(im)
    a = np.asarray(keyed)[:, :, 3]
    if (a > 8).mean() > 0.92:
        keyed = key_flat(im)
    return keyed


def fit_bbox(im: Image.Image, canvas: tuple[int, int], top: int, height: int) -> Image.Image:
    rgba = im.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("no opaque pixels after key")
    subject = rgba.crop(bbox)
    scale = height / subject.height
    nw, nh = max(1, int(subject.width * scale)), max(1, int(subject.height * scale))
    subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", canvas, (0, 0, 0, 0))
    x = (canvas[0] - nw) // 2
    y = top
    if y + nh > canvas[1]:
        y = canvas[1] - nh
    out.alpha_composite(subject, (max(0, x), max(0, y)))
    return out


def circle_portrait(im: Image.Image) -> Image.Image:
    fitted = fit_bbox(im, PORTRAIT_CANVAS, PORTRAIT_TOP, PORTRAIT_HEIGHT)
    mask = Image.new("L", PORTRAIT_CANVAS, 0)
    ImageDraw.Draw(mask).ellipse((6, 6, 505, 505), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.2))
    out = Image.new("RGBA", PORTRAIT_CANVAS, (0, 0, 0, 0))
    out.paste(fitted, (0, 0), fitted)
    a = np.minimum(np.asarray(out.getchannel("A")), np.asarray(mask))
    out.putalpha(Image.fromarray(a, "L"))
    return out


def save_webp(im: Image.Image, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", lossless=True, quality=100, method=4, exact=True)


def process_file(src: Path, shot: str) -> Image.Image:
    keyed = cutout(Image.open(src))
    if shot == "portrait":
        return circle_portrait(keyed)
    if shot == "dialogue":
        return fit_bbox(keyed, PORTRAIT_CANVAS, PORTRAIT_TOP, PORTRAIT_HEIGHT)
    return fit_bbox(keyed, LIVE_CANVAS, LIVE_TOP, LIVE_HEIGHT)


def install_live(aligned: Image.Image, cid: str, backup: bool = True) -> list[Path]:
    dest_dir = ANDROID / "characters" / cid / "default"
    written: list[Path] = []
    for name in ("live_idle.webp", "live_blink.webp"):
        dest = dest_dir / name
        if backup and dest.exists():
            bak = OUT / "backup" / cid / name
            bak.parent.mkdir(parents=True, exist_ok=True)
            if not bak.exists():
                shutil.copy2(dest, bak)
        save_webp(aligned, dest)
        written.append(dest)
    return written


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Align NAI stills to Sakurayo canvases.")
    parser.add_argument("--src", required=True, help="raw PNG")
    parser.add_argument("--shot", choices=("live", "portrait", "dialogue"), default="live")
    parser.add_argument("--char", required=True)
    parser.add_argument("--out", default="")
    parser.add_argument("--install", action="store_true", help="write live_idle/live_blink into game art")
    args = parser.parse_args(argv)
    aligned = process_file(Path(args.src), args.shot)
    out = Path(args.out) if args.out else OUT / "aligned" / f"{args.char}_{args.shot}.webp"
    save_webp(aligned, out)
    print(f"wrote {out} {out.stat().st_size} {aligned.size}")
    if args.install:
        if args.shot != "live":
            print("install currently only writes live_idle/live_blink", file=sys.stderr)
            return 2
        for dest in install_live(aligned, args.char):
            print(f"installed {dest} {dest.stat().st_size}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
