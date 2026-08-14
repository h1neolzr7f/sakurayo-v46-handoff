#!/usr/bin/env python3
"""Video / still → frames → chroma key → lobby live WebP.

Use for fake Live2D idle:
  1. Generate a green-screen clip from a character still (infsh / any I2V).
  2. python tools/image2/live_pipeline.py --video path.mp4 --cid sayo
  3. Or key the existing black-bg live_idle / live_blink in place:

  python tools/image2/live_pipeline.py --key-existing
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
ANDROID = ROOT / "android-app" / "app" / "src" / "main" / "assets" / "game" / "art"
KEEP = ROOT / "assets" / "image2" / "source"
OFFLINE = ROOT.parent / "offline" / "game" / "art"
CHARS = ("sayo", "aya", "rion")


def pack_animated_webp(frames: list[Image.Image], dest: Path, duration: int = 220) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Keep RGBA (no yuva420p). 4:2:0 chroma makes hair/silhouette stair-step.
    frames[0].save(
        dest,
        "WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=[duration] * len(frames),
        loop=0,
        lossless=True,
        quality=100,
        method=4,
        exact=True,
    )


def write_all(im: Image.Image, rel: str, animated: bool = False, duration: int = 220) -> None:
    for dest_root in (ANDROID, KEEP, OFFLINE):
        if dest_root == OFFLINE and not dest_root.parent.parent.exists():
            continue
        dest = dest_root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if animated and isinstance(im, list):
            pack_animated_webp(im, dest, duration)
        else:
            frame = im[0] if isinstance(im, list) else im
            if dest.suffix.lower() == ".webp":
                frame.save(dest, "WEBP", lossless=True, quality=100, method=4, exact=True)
            else:
                frame.save(dest)
        print(f"wrote {dest} {dest.stat().st_size}")


def key_green(im: Image.Image) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).copy()
    r, g, b = arr[:, :, 0].astype(np.int16), arr[:, :, 1].astype(np.int16), arr[:, :, 2].astype(np.int16)
    mask = (g > 70) & (g > r + 24) & (g > b + 24)
    arr[:, :, 3] = np.where(mask, 0, arr[:, :, 3])
    return feather_alpha(Image.fromarray(arr, "RGBA"))


def key_edge_dark(im: Image.Image, thresh: int = 20) -> Image.Image:
    """Remove only background black connected to the frame edge, keep black hair."""
    arr = np.asarray(im.convert("RGBA")).copy()
    h, w = arr.shape[:2]
    dark = arr[:, :, :3].max(axis=2) <= thresh
    vis = np.zeros((h, w), dtype=bool)
    stack = []
    for x in range(w):
        if dark[0, x]:
            vis[0, x] = True
            stack.append((0, x))
        if dark[h - 1, x]:
            vis[h - 1, x] = True
            stack.append((h - 1, x))
    for y in range(h):
        if dark[y, 0] and not vis[y, 0]:
            vis[y, 0] = True
            stack.append((y, 0))
        if dark[y, w - 1] and not vis[y, w - 1]:
            vis[y, w - 1] = True
            stack.append((y, w - 1))
    while stack:
        y, x = stack.pop()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not vis[ny, nx] and dark[ny, nx]:
                vis[ny, nx] = True
                stack.append((ny, nx))
    grown = vis.copy()
    grown[1:, :] |= vis[:-1, :]
    grown[:-1, :] |= vis[1:, :]
    grown[:, 1:] |= vis[:, :-1]
    grown[:, :-1] |= vis[:, 1:]
    luma = arr[:, :, :3].max(axis=2)
    # Choke one dark halo pixel so the silhouette does not keep a black rim.
    vis = vis | (grown & (luma <= thresh + 10))
    alpha = np.where(vis, 0, 255).astype(np.uint8)
    ring = grown & ~vis
    alpha = np.where(ring, np.minimum(alpha, 90), alpha)
    arr[:, :, 3] = alpha
    return feather_alpha(Image.fromarray(arr, "RGBA"))


def feather_alpha(im: Image.Image, radius: float = 2.2) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).copy()
    hard = arr[:, :, 3]
    soft = np.asarray(Image.fromarray(hard, "L").filter(ImageFilter.GaussianBlur(radius=radius)))
    # Keep the interior solid, only the rim goes soft so 512 art does not stair-step.
    arr[:, :, 3] = np.where(hard > 240, 255, soft)
    return Image.fromarray(arr, "RGBA")


def _try_cv2():
    try:
        import cv2  # type: ignore

        return cv2
    except Exception:
        return None


def polish_cutout(im: Image.Image, out_side: int = 1024) -> Image.Image:
    """Upscale, round the stair-step mask, then add a thin soft rim."""
    im = im.convert("RGBA")
    scale = out_side / max(im.size)
    if scale > 1.01:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.Resampling.LANCZOS)
    arr = np.asarray(im.convert("RGBA")).copy()
    rgb = arr[:, :, :3].astype(np.float32)
    a = arr[:, :, 3]
    opaque = rgb[a > 200]
    dark_hair = bool(len(opaque) and float(opaque.max(axis=1).mean()) < 70)
    mid = float(((a > 0) & (a < 255)).mean())
    cut = 160 if mid > 0.05 else 80
    hard = (a > cut).astype(np.uint8) * 255
    cv2 = _try_cv2()
    if cv2 is not None:
        # Blur + rethreshold rounds 512 stair-steps instead of feathering the jaggies.
        rounded = cv2.GaussianBlur(hard, (0, 0), 2.4)
        hard = np.where(rounded > (118 if dark_hair else 138), 255, 0).astype(np.uint8)
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        hard = cv2.morphologyEx(hard, cv2.MORPH_CLOSE, k)
        num, labels, st, _ = cv2.connectedComponentsWithStats(hard)
        if num > 1:
            keep = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
            hard = np.where(labels == keep, 255, 0).astype(np.uint8)
        dist_in = cv2.distanceTransform(hard, cv2.DIST_L2, 5)
        dist_out = cv2.distanceTransform(255 - hard, cv2.DIST_L2, 5)
        signed = dist_in.astype(np.float32) - dist_out.astype(np.float32)
        t = np.clip((signed + 2.1) / 3.4, 0, 1)
        soft = t * t * (3.0 - 2.0 * t) * 255.0
        soft = np.where(dist_in > 2.4, 255.0, soft)
    else:
        mask = Image.fromarray(hard, "L").filter(ImageFilter.GaussianBlur(radius=2.2))
        hard_im = mask.point(lambda x: 255 if x > (118 if dark_hair else 138) else 0)
        soft = np.asarray(hard_im.filter(ImageFilter.GaussianBlur(radius=1.6)), dtype=np.float32)
        interior = np.asarray(hard_im.filter(ImageFilter.MinFilter(5))) > 200
        soft = np.where(interior, 255.0, soft)

    a01 = np.clip(soft / 255.0, 0, 1)
    fringe = (soft > 10) & (soft < 220)
    luma = rgb.max(axis=2)
    # Only the outer 2px: kill white/grey halo, keep white jacket interiors.
    if cv2 is not None:
        outer = cv2.distanceTransform(hard, cv2.DIST_L2, 5) < 2.2
        pale = outer & (luma > 188)
        soft = np.where(pale, 0, soft)
    for c in range(3):
        rgb[:, :, c] = np.where(fringe, np.clip(rgb[:, :, c] / np.maximum(a01, 0.22), 0, 255), rgb[:, :, c])
        rgb[:, :, c] = np.where(soft < 8, 0, rgb[:, :, c])
    out = np.dstack([rgb.astype(np.uint8), soft.astype(np.uint8)])
    return Image.fromarray(out, "RGBA")


def already_keyed(im: Image.Image) -> bool:
    alpha = np.asarray(im.convert("RGBA"))[:, :, 3]
    return float((alpha == 0).mean()) > 0.12


def key_auto(im: Image.Image) -> Image.Image:
    arr = np.asarray(im.convert("RGB"))
    r, g, b = arr[:, :, 0].astype(np.int16), arr[:, :, 1].astype(np.int16), arr[:, :, 2].astype(np.int16)
    green = int(((g > 70) & (g > r + 24) & (g > b + 24)).mean() * 100)
    if green >= 8:
        return key_green(im)
    return key_edge_dark(im)


def frames_of(path: Path) -> list[Image.Image]:
    im = Image.open(path)
    n = getattr(im, "n_frames", 1)
    out = []
    for i in range(n):
        im.seek(i)
        out.append(im.convert("RGBA").copy())
    return out


def extract_video(video: Path, dest: Path, fps: float = 8) -> list[Path]:
    dest.mkdir(parents=True, exist_ok=True)
    pattern = dest / "%04d.png"
    cmd = ["ffmpeg", "-y", "-i", str(video), "-vf", f"fps={fps}", str(pattern)]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return sorted(dest.glob("*.png"))


def upscale_min(im: Image.Image, min_side: int = 768) -> Image.Image:
    if max(im.size) >= min_side:
        return im
    scale = min_side / max(im.size)
    return im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.Resampling.LANCZOS)


def fit_contain(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    tw, th = size
    scale = min(tw / im.width, th / im.height)
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((tw - nw) // 2, th - nh), resized)
    return canvas


def key_existing() -> None:
    for cid in CHARS:
        folder = ANDROID / "characters" / cid / "default"
        idle = folder / "live_idle.webp"
        blink = folder / "live_blink.webp"
        battle = folder / "battle.webp"
        dialogue = folder / "dialogue.webp"
        source = battle if battle.is_file() else dialogue if dialogue.is_file() else idle
        if source.is_file():
            still = Image.open(source)
            hero = still if already_keyed(still) else key_auto(still)
            hero = polish_cutout(hero, 1280)
            write_all(fit_contain(hero, (768, 1280)), f"gacha/hero_{cid}.webp")
            write_all(hero, f"characters/{cid}/default/live_idle.webp")
            write_all(hero, f"characters/{cid}/default/live_blink.webp")
        elif blink.is_file():
            b = Image.open(blink)
            base = b if already_keyed(b) else key_auto(b)
            write_all(polish_cutout(base, 1024), f"characters/{cid}/default/live_blink.webp")
        leftover = folder / "_pack_live_idle"
        if leftover.is_dir():
            for old in leftover.glob("*"):
                old.unlink()
            leftover.rmdir()
        keep_pack = KEEP / "characters" / cid / "default" / "_pack_live_idle"
        if keep_pack.is_dir():
            for old in keep_pack.glob("*"):
                old.unlink()
            keep_pack.rmdir()


def from_video(video: Path, cid: str, fps: float) -> None:
    if cid not in CHARS:
        raise SystemExit(f"cid must be one of {CHARS}")
    work = ROOT / "tools" / "image2" / "_live_frames" / cid
    if work.exists():
        for old in work.glob("*"):
            old.unlink()
    paths = extract_video(video, work, fps)
    if not paths:
        raise SystemExit("no frames extracted")
    keyed = [key_auto(Image.open(p)) for p in paths]
    # keep a short loop: at most 12 frames
    if len(keyed) > 12:
        step = len(keyed) / 12
        keyed = [keyed[int(i * step)] for i in range(12)]
    keyed = [polish_cutout(frame, 1024) for frame in keyed]
    write_all(keyed, f"characters/{cid}/default/live_idle.webp", animated=True)
    write_all(fit_contain(keyed[0], (900, 1200)), f"gacha/hero_{cid}.webp")
    blink = ANDROID / "characters" / cid / "default" / "live_blink.webp"
    if blink.is_file():
        write_all(key_auto(Image.open(blink)), f"characters/{cid}/default/live_blink.webp")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--key-existing", action="store_true")
    parser.add_argument("--video", type=Path)
    parser.add_argument("--cid", choices=CHARS)
    parser.add_argument("--fps", type=float, default=8)
    args = parser.parse_args()
    if args.video:
        from_video(args.video, args.cid or "sayo", args.fps)
        return 0
    if args.key_existing or not args.video:
        key_existing()
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
