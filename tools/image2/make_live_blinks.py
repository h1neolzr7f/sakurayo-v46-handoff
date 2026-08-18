#!/usr/bin/env python3
"""Derive pixel-stable closed-eye lobby frames from the approved idle art.

The generated frame changes only a tiny eye-area mask, so crossfading it over
the idle frame cannot make the body, weapon, or silhouette jump. Pillow is a
development-only dependency; the game still ships plain lossless WebP files.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "android-app/app/src/main/assets/game/art/characters"

# (center x, eyelid y, width, rotation, patch center y, patch height)
CONFIG = {
    "sayo": {
        "skin": (247, 221, 208, 255),
        "line": (66, 37, 64, 255),
        "eyes": [(623, 202, 48, -2, 207, 44), (698, 199, 47, 1, 204, 42)],
    },
    "aya": {
        "skin": (250, 220, 205, 255),
        "line": (64, 54, 65, 255),
        "eyes": [(566, 169, 43, -12, 172, 35), (622, 161, 42, -8, 164, 34)],
    },
    "rion": {
        "skin": (239, 208, 197, 255),
        "line": (54, 28, 32, 255),
        "eyes": [(597, 171, 42, -15, 174, 35), (653, 158, 42, -12, 161, 35)],
    },
}


def rotate(x: float, y: float, degrees: float) -> tuple[float, float]:
    angle = math.radians(degrees)
    cos_a, sin_a = math.cos(angle), math.sin(angle)
    return x * cos_a - y * sin_a, x * sin_a + y * cos_a


def eye_mask(
    size: tuple[int, int],
    center_x: int,
    center_y: int,
    width: int,
    height: int,
    angle: float,
) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    points = []
    for index in range(64):
        theta = math.tau * index / 64
        x, y = rotate(
            math.cos(theta) * width / 2,
            math.sin(theta) * height / 2,
            angle,
        )
        points.append((center_x + x, center_y + y))
    draw.polygon(points, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(1.4))


def draw_lid(
    image: Image.Image,
    center_x: int,
    center_y: int,
    width: int,
    angle: float,
    color: tuple[int, int, int, int],
) -> None:
    draw = ImageDraw.Draw(image)
    curve = []
    for index in range(31):
        t = index / 30
        x = (t - 0.5) * (width * 0.74)
        y = 3.0 * (1 - ((t - 0.5) * 2) ** 2) - 2
        x, y = rotate(x, y, angle)
        curve.append((center_x + x, center_y + y))
    draw.line(curve, fill=color, width=3, joint="curve")

    x1, y1 = rotate(-width * 0.37, -1.5, angle)
    x2, y2 = rotate(-width * 0.47, -3.5, angle)
    draw.line(
        [(center_x + x1, center_y + y1), (center_x + x2, center_y + y2)],
        fill=color,
        width=2,
    )


def build(character: str) -> None:
    config = CONFIG[character]
    source = ART / character / "default/live_idle.webp"
    output = ART / character / "default/live_blink.webp"
    image = Image.open(source).convert("RGBA")
    if image.size != (1280, 1280):
        raise ValueError(f"{source} must remain 1280x1280, got {image.size}")

    for center_x, lid_y, width, angle, patch_y, patch_height in config["eyes"]:
        mask = eye_mask(image.size, center_x, patch_y, width, patch_height, angle)
        skin = Image.new("RGBA", image.size, config["skin"])
        image = Image.composite(skin, image, mask)
        draw_lid(image, center_x, lid_y, width, angle, config["line"])

    image.save(output, "WEBP", lossless=True, method=6, exact=True)
    if output.read_bytes() == source.read_bytes():
        raise RuntimeError(f"{output} is identical to idle art")
    print(f"WROTE {output.relative_to(ROOT)}")


def main() -> int:
    for character in CONFIG:
        build(character)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
