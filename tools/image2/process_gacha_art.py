#!/usr/bin/env python3
"""Convert generated 镜界寻访 art to WebP and key hero cutouts."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
GEN = (
    Path.home()
    / ".cursor"
    / "projects"
    / "c-Users-tzzcomputer-Documents-Codex-2026-07-10-new-chat-6-work-v423-delivery-source"
    / "assets"
)
ANDROID = ROOT / "android-app" / "app" / "src" / "main" / "assets" / "game" / "art"
KEEP = ROOT / "assets" / "image2" / "source"
OFFLINE = ROOT.parent / "offline" / "game" / "art"

JOBS = [
    ("gacha-banner-bg.png", "gacha/banner_bg.webp", (1280, 720), "cover"),
    ("gacha-card-back.png", "gacha/card_back.webp", (768, 1024), "cover"),
    ("gacha-sayo-echo.png", "gacha/sayo_echo.webp", (768, 1024), "cover"),
    ("gacha-aya-petal.png", "gacha/aya_petal.webp", (768, 1024), "cover"),
    ("gacha-rion-edge.png", "gacha/rion_edge.webp", (768, 1024), "cover"),
    ("gacha-night-radio.png", "gacha/night_radio.webp", (768, 1024), "cover"),
    ("gacha-shrine-seal.png", "gacha/shrine_seal.webp", (768, 1024), "cover"),
    ("gacha-void-ticket.png", "gacha/void_ticket.webp", (768, 1024), "cover"),
    ("gacha-cherry-crown.png", "gacha/cherry_crown.webp", (768, 1024), "cover"),
    ("gacha-last-witness.png", "gacha/last_witness.webp", (768, 1024), "cover"),
    ("nav-gacha.png", "ui/nav/gacha.webp", (256, 256), "cover"),
    ("nav-roster.png", "ui/nav/roster.webp", (256, 256), "cover"),
]


def fit(im: Image.Image, size: tuple[int, int], mode: str) -> Image.Image:
    im = im.convert("RGB")
    tw, th = size
    if mode == "contain":
        canvas = Image.new("RGB", size, (6, 4, 16))
        scale = min(tw / im.width, th / im.height)
        nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
        im = im.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas.paste(im, ((tw - nw) // 2, (th - nh) // 2))
        return canvas
    scale = max(tw / im.width, th / im.height)
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))


def cover_card_back_letter(im: Image.Image) -> Image.Image:
    """Hide the accidental center N on the card back."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    cx, cy = w // 2, int(h * 0.46)
    rw, rh = int(w * 0.16), int(h * 0.13)
    sample = rgb.resize((1, 1), Image.Resampling.BOX, box=(cx - rw, cy - rh, cx + rw, cy + rh)).getpixel((0, 0))
    overlay = Image.new("RGBA", rgb.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.ellipse((cx - rw, cy - rh, cx + rw, cy + rh), fill=(*sample, 255))
    ring = Image.new("RGBA", rgb.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.ellipse((cx - int(rw * 1.18), cy - int(rh * 1.18), cx + int(rw * 1.18), cy + int(rh * 1.18)), outline=(243, 210, 122, 210), width=max(3, w // 90))
    out = rgb.convert("RGBA")
    out.alpha_composite(overlay.filter(ImageFilter.GaussianBlur(1.2)))
    out.alpha_composite(ring)
    return out.convert("RGB")


def key_black(im: Image.Image, thresh: int = 18) -> Image.Image:
    rgba = im.convert("RGBA")
    pixels = list(rgba.getdata())
    keyed = []
    for r, g, b, a in pixels:
        if r <= thresh and g <= thresh and b <= thresh:
            keyed.append((r, g, b, 0))
        else:
            keyed.append((r, g, b, a))
    rgba.putdata(keyed)
    return rgba


def write_all(im: Image.Image, rel: str, quality: int = 88) -> None:
    for root in (ANDROID, KEEP, OFFLINE):
        if root == OFFLINE and not root.parent.parent.exists():
            continue
        dest = root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        save = im
        if dest.suffix.lower() == ".webp":
            if im.mode == "RGBA":
                save.save(dest, "WEBP", quality=quality, method=6)
            else:
                save.convert("RGB").save(dest, "WEBP", quality=quality, method=6)
        else:
            save.save(dest)
        print(f"wrote {dest} {dest.stat().st_size}")


def main() -> int:
    if not GEN.is_dir():
        print("no gen folder", GEN)
        return 1
    for name, rel, size, mode in JOBS:
        src = GEN / name
        if not src.is_file():
            print("missing", src)
            continue
        canvas = fit(Image.open(src), size, mode)
        if name == "gacha-card-back.png":
            canvas = cover_card_back_letter(canvas)
        write_all(canvas, rel)
        keep_png = KEEP / rel.replace(".webp", ".png")
        keep_png.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(keep_png, "PNG")
    live_root = ANDROID / "characters"
    for cid in ("sayo", "aya", "rion"):
        standee = GEN / f"gacha-hero-{cid}.png"
        if standee.is_file():
            canvas = fit(Image.open(standee), (768, 1024), "cover")
            write_all(canvas, f"gacha/hero_{cid}.webp", quality=90)
            keep_png = KEEP / f"gacha/hero_{cid}.png"
            keep_png.parent.mkdir(parents=True, exist_ok=True)
            canvas.save(keep_png, "PNG")
            continue
        src = live_root / cid / "default" / "live_idle.webp"
        if not src.is_file():
            print("missing live", src)
            continue
        cut = key_black(Image.open(src))
        write_all(cut, f"gacha/hero_{cid}.webp", quality=90)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
