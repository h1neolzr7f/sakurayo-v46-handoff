#!/usr/bin/env python3
"""Chroma-key NAI stills and lock them to the existing lobby / portrait canvases."""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from prompts import PROPS, SCENES

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


def key_edge_chroma(im: Image.Image, tol: int = 28) -> Image.Image:
    """Drop the backdrop by flooding from the frame edge using sampled paper color."""
    arr = np.asarray(im.convert("RGBA")).copy()
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3].astype(np.int16)
    edge = np.concatenate(
        [arr[:6, :, :3].reshape(-1, 3), arr[-6:, :, :3].reshape(-1, 3),
         arr[:, :6, :3].reshape(-1, 3), arr[:, -6:, :3].reshape(-1, 3)]
    )
    paper = np.median(edge, axis=0).astype(np.int16)
    dist = np.abs(rgb - paper).sum(axis=2)
    near = dist <= tol
    vis = np.zeros((h, w), dtype=bool)
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not vis[y, x]:
                vis[y, x] = True
                stack.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not vis[y, x]:
                vis[y, x] = True
                stack.append((y, x))
    while stack:
        y, x = stack.pop()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not vis[ny, nx] and near[ny, nx]:
                vis[ny, nx] = True
                stack.append((ny, nx))
    arr[:, :, 3] = np.where(vis, 0, arr[:, :, 3])
    return feather_alpha(Image.fromarray(arr, "RGBA"))


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


def clean_fringe(im: Image.Image) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).copy()
    r, g, b = arr[:, :, 0].astype(np.int16), arr[:, :, 1].astype(np.int16), arr[:, :, 2].astype(np.int16)
    a = arr[:, :, 3]
    greenish = (g > r + 10) & (g > b + 10)
    # Drop weak green halo; despill stronger interior leftovers.
    drop = greenish & (a < 140)
    arr[:, :, 3] = np.where(drop, 0, a)
    keep = greenish & (arr[:, :, 3] >= 140)
    mid = ((r + b) // 2).astype(np.uint8)
    arr[:, :, 1] = np.where(keep, np.minimum(arr[:, :, 1], mid), arr[:, :, 1])
    return feather_alpha(Image.fromarray(arr, "RGBA"), radius=1.4)


def cutout(im: Image.Image) -> Image.Image:
    keyed = key_edge_chroma(im)
    cover = (np.asarray(keyed)[:, :, 3] > 8).mean()
    if cover > 0.88 or cover < 0.04:
        keyed = key_green(im)
        cover = (np.asarray(keyed)[:, :, 3] > 8).mean()
    if cover > 0.88 or cover < 0.04:
        keyed = key_flat(im)
    return clean_fringe(keyed)


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


def bust_crop(im: Image.Image) -> Image.Image:
    """If NAI ignored upper-body and drew full body, keep the head and bust."""
    rgba = im.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    if not bbox:
        return rgba
    subject = rgba.crop(bbox)
    if subject.height > subject.width * 1.35:
        cut = int(subject.height * 0.48)
        subject = subject.crop((0, 0, subject.width, cut))
    return subject


def circle_portrait(im: Image.Image) -> Image.Image:
    fitted = fit_bbox(bust_crop(im), PORTRAIT_CANVAS, PORTRAIT_TOP, PORTRAIT_HEIGHT)
    mask = Image.new("L", PORTRAIT_CANVAS, 0)
    ImageDraw.Draw(mask).ellipse((6, 6, 505, 505), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.2))
    out = Image.new("RGBA", PORTRAIT_CANVAS, (0, 0, 0, 0))
    out.paste(fitted, (0, 0), fitted)
    a = np.minimum(np.asarray(out.getchannel("A")), np.asarray(mask))
    out.putalpha(Image.fromarray(a, "L"))
    return out


def save_webp(im: Image.Image, dest: Path, *, lossless: bool = True) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if lossless:
        im.save(dest, "WEBP", lossless=True, quality=100, method=4, exact=True)
    else:
        im.save(dest, "WEBP", quality=90, method=6)


def process_file(src: Path, shot: str) -> Image.Image:
    keyed = cutout(Image.open(src))
    if shot == "portrait":
        return circle_portrait(keyed)
    if shot == "dialogue":
        return fit_bbox(keyed, PORTRAIT_CANVAS, PORTRAIT_TOP, PORTRAIT_HEIGHT)
    return fit_bbox(keyed, LIVE_CANVAS, LIVE_TOP, LIVE_HEIGHT)


def cover_fit(im: Image.Image, canvas: tuple[int, int]) -> Image.Image:
    """Scale to cover a canvas and center-crop. Used for scenery / card stills."""
    src = im.convert("RGB")
    tw, th = canvas
    scale = max(tw / src.width, th / src.height)
    nw = max(1, int(round(src.width * scale)))
    nh = max(1, int(round(src.height * scale)))
    src = src.resize((nw, nh), Image.Resampling.LANCZOS)
    x = max(0, (nw - tw) // 2)
    y = max(0, (nh - th) // 2)
    return src.crop((x, y, x + tw, y + th))


def backup_art(dest: Path, cid: str) -> None:
    if not dest.exists():
        return
    bak = OUT / "backup" / cid / dest.name
    bak.parent.mkdir(parents=True, exist_ok=True)
    if not bak.exists():
        shutil.copy2(dest, bak)


def install_live(aligned: Image.Image, cid: str, backup: bool = True) -> list[Path]:
    dest_dir = ANDROID / "characters" / cid / "default"
    written: list[Path] = []
    for name in ("live_idle.webp", "live_blink.webp"):
        dest = dest_dir / name
        if backup:
            backup_art(dest, cid)
        save_webp(aligned, dest)
        written.append(dest)
    return written


def install_portrait(aligned: Image.Image, cid: str, backup: bool = True) -> Path:
    dest = ANDROID / "characters" / cid / "default" / "portrait.webp"
    if backup:
        backup_art(dest, cid)
    save_webp(aligned, dest)
    return dest


def install_catalog(aligned: Image.Image, dest_rel: str, backup_id: str, backup: bool = True, lossless: bool = False) -> Path:
    dest = ANDROID / dest_rel
    if backup:
        backup_art(dest, backup_id)
    save_webp(aligned, dest, lossless=lossless)
    return dest


def process_cover(src: Path, canvas: tuple[int, int]) -> Image.Image:
    return cover_fit(Image.open(src), canvas)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Align NAI stills to Sakurayo canvases.")
    parser.add_argument("--src", required=True, help="raw PNG")
    parser.add_argument("--shot", choices=("live", "portrait", "dialogue"), default="live")
    parser.add_argument("--char", default="")
    parser.add_argument("--scene", default="", help="scenery id from prompts.SCENES")
    parser.add_argument("--prop", default="", help="prop id from prompts.PROPS")
    parser.add_argument("--out", default="")
    parser.add_argument("--install", action="store_true", help="write into game art")
    args = parser.parse_args(argv)
    kinds = [bool(args.char), bool(args.scene), bool(args.prop)]
    if sum(kinds) != 1:
        parser.error("specify exactly one of --char / --scene / --prop")

    if args.scene:
        if args.scene not in SCENES:
            parser.error(f"unknown scene {args.scene}; use {sorted(SCENES)}")
        spec = SCENES[args.scene]
        aligned = process_cover(Path(args.src), tuple(spec["canvas"]))
        out = Path(args.out) if args.out else OUT / "aligned" / f"{args.scene}.webp"
        save_webp(aligned, out, lossless=False)
        print(f"wrote {out} {out.stat().st_size} {aligned.size}")
        if args.install:
            dest = install_catalog(aligned, spec["dest"], args.scene, lossless=False)
            print(f"installed {dest} {dest.stat().st_size}")
        return 0

    if args.prop:
        if args.prop not in PROPS:
            parser.error(f"unknown prop {args.prop}; use {sorted(PROPS)}")
        spec = PROPS[args.prop]
        aligned = process_cover(Path(args.src), tuple(spec["canvas"]))
        out = Path(args.out) if args.out else OUT / "aligned" / f"{args.prop}.webp"
        save_webp(aligned, out, lossless=False)
        print(f"wrote {out} {out.stat().st_size} {aligned.size}")
        if args.install:
            dest = install_catalog(aligned, spec["dest"], args.prop, lossless=False)
            print(f"installed {dest} {dest.stat().st_size}")
        return 0

    aligned = process_file(Path(args.src), args.shot)
    out = Path(args.out) if args.out else OUT / "aligned" / f"{args.char}_{args.shot}.webp"
    save_webp(aligned, out)
    print(f"wrote {out} {out.stat().st_size} {aligned.size}")
    if args.install:
        if args.shot == "live":
            for dest in install_live(aligned, args.char):
                print(f"installed {dest} {dest.stat().st_size}")
        elif args.shot == "portrait":
            dest = install_portrait(aligned, args.char)
            print(f"installed {dest} {dest.stat().st_size}")
        else:
            print("dialogue install not wired; wrote aligned file only", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
