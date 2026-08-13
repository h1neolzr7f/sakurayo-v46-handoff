#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

SCRIPT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = SCRIPT_ROOT / "assets" / "image2" / "asset_manifest.json"
KEYER = Path.home() / ".codex" / "skills" / ".system" / "imagegen" / "scripts" / "remove_chroma_key.py"


def rgba_fit(cell: Image.Image, size: tuple[int, int], padding: int = 12) -> tuple[Image.Image, dict]:
    cell = cell.convert("RGBA")
    alpha = cell.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError("empty alpha cell")
    crop = cell.crop(bbox)
    max_w, max_h = max(1, size[0] - padding * 2), max(1, size[1] - padding * 2)
    crop.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    x, y = (size[0] - crop.width) // 2, (size[1] - crop.height) // 2
    canvas.alpha_composite(crop, (x, y))
    opaque = sum(canvas.getchannel("A").histogram()[9:])
    coverage = opaque / (size[0] * size[1])
    corners = [canvas.getpixel((0, 0))[3], canvas.getpixel((size[0]-1, 0))[3], canvas.getpixel((0, size[1]-1))[3], canvas.getpixel((size[0]-1, size[1]-1))[3]]
    if max(corners) > 8:
        raise ValueError(f"non-transparent corner alpha: {corners}")
    if not 0.01 <= coverage <= 0.90:
        raise ValueError(f"implausible subject coverage: {coverage:.4f}")
    return canvas, {"source_bbox": bbox, "coverage": round(coverage, 5), "corners": corners}


def remove_small_alpha_components(cell: Image.Image, min_ratio: float) -> Image.Image:
    """Drop isolated alpha islands smaller than a fraction of the largest subject."""
    if min_ratio <= 0:
        return cell
    rgba = cell.convert("RGBA")
    alpha = rgba.getchannel("A")
    pixels = alpha.load()
    width, height = alpha.size
    visited = bytearray(width * height)
    components: list[list[int]] = []

    for y in range(height):
        for x in range(width):
            start = y * width + x
            if visited[start]:
                continue
            visited[start] = 1
            if pixels[x, y] <= 8:
                continue
            stack = [start]
            component: list[int] = []
            while stack:
                current = stack.pop()
                component.append(current)
                cx, cy = current % width, current // width
                for ny in range(max(0, cy - 1), min(height, cy + 2)):
                    for nx in range(max(0, cx - 1), min(width, cx + 2)):
                        candidate = ny * width + nx
                        if visited[candidate]:
                            continue
                        visited[candidate] = 1
                        if pixels[nx, ny] > 8:
                            stack.append(candidate)
            components.append(component)

    if not components:
        return rgba
    largest = max(len(component) for component in components)
    cutoff = max(1, int(largest * min_ratio))
    cleaned = alpha.copy()
    cleaned_pixels = cleaned.load()
    for component in components:
        if len(component) >= cutoff:
            continue
        for index in component:
            cleaned_pixels[index % width, index // width] = 0
    rgba.putalpha(cleaned)
    return rgba


def _axis_segments(values: list[int], threshold: int = 8) -> list[tuple[int, int]]:
    segments: list[tuple[int, int]] = []
    start = None
    for index, value in enumerate(values + [0]):
        if value > threshold and start is None:
            start = index
        elif value <= threshold and start is not None:
            segments.append((start, index))
            start = None
    return segments


def detect_tile_boxes(atlas: Image.Image, columns: int, rows: int) -> list[tuple[int, int, int, int]]:
    """Detect separated bright rounded-square tiles on a dark atlas background."""
    rgb = atlas.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    column_counts = [sum(max(pixels[x, y]) > 55 for y in range(height)) for x in range(width)]
    row_counts = [sum(max(pixels[x, y]) > 55 for x in range(width)) for y in range(height)]
    x_segments = _axis_segments(column_counts)
    y_segments = _axis_segments(row_counts)
    min_width = width / (columns * 3)
    min_height = height / (rows * 3)
    x_segments = [segment for segment in x_segments if segment[1] - segment[0] >= min_width]
    y_segments = [segment for segment in y_segments if segment[1] - segment[0] >= min_height]
    if len(x_segments) != columns or len(y_segments) != rows:
        raise ValueError(
            f"detected grid mismatch: expected {columns}x{rows}, "
            f"found {len(x_segments)}x{len(y_segments)}"
        )
    return [
        (left, top, right, bottom)
        for top, bottom in y_segments
        for left, right in x_segments
    ]


def process_job(
    manifest_path: Path,
    job_id: str,
    edge_contract: bool = False,
    detect_tiles: bool = False,
) -> dict:
    manifest_path = manifest_path.resolve()
    # Standard layout: <project>/assets/image2/asset_manifest.json.  Deriving the
    # root from the selected manifest also makes isolated QA manifests portable.
    root = manifest_path.parents[2]
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    job = next((item for item in manifest["jobs"] if item["id"] == job_id), None)
    if not job:
        raise KeyError(job_id)
    source = root / job["source"]
    processed = root / job["processed"]
    if not source.exists():
        raise FileNotFoundError(source)
    processed.parent.mkdir(parents=True, exist_ok=True)

    if job["transparent"]:
        command = [
            sys.executable, "-I", str(KEYER), "--input", str(source), "--out", str(processed),
            "--auto-key", "border", "--soft-matte", "--transparent-threshold", "12",
            "--opaque-threshold", "220", "--despill", "--force",
        ]
        if edge_contract:
            command += ["--edge-contract", "1"]
        subprocess.run(command, check=True)
    else:
        shutil.copy2(source, processed)

    atlas = Image.open(processed).convert("RGBA")
    cols, rows = job["grid"]["columns"], job["grid"]["rows"]
    cell_w, cell_h = atlas.width // cols, atlas.height // rows
    detected_boxes = detect_tile_boxes(atlas, cols, rows) if detect_tiles else None
    output_root = root / manifest["output_root"]
    report = {"job": job_id, "source": str(source), "atlas_size": atlas.size, "cell_size": [cell_w, cell_h], "detected_tiles": detect_tiles, "outputs": []}
    preview_tiles: list[tuple[str, Image.Image]] = []

    for cell_spec in job["grid"]["cells"]:
        index = cell_spec["index"]
        col, row = index % cols, index // cols
        default_box = detected_boxes[index] if detected_boxes else (col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h)
        box = tuple(cell_spec.get("source_box", default_box))
        cell = atlas.crop(box)
        cell = remove_small_alpha_components(cell, float(cell_spec.get("min_component_ratio", job.get("min_component_ratio", 0))))
        target_size = tuple(cell_spec["size"])
        if job["transparent"]:
            final, stats = rgba_fit(cell, target_size)
            save_args = {"lossless": True, "method": 6}
        else:
            final = (
                cell.convert("RGB").resize(target_size, Image.Resampling.LANCZOS)
                if detected_boxes
                else ImageOps.fit(cell.convert("RGB"), target_size, method=Image.Resampling.LANCZOS)
            )
            stats = {"coverage": 1.0, "source_box": box}
            save_args = {"quality": 88, "method": 6}
        out = output_root / cell_spec["output"]
        out.parent.mkdir(parents=True, exist_ok=True)
        final.save(out, "WEBP", **save_args)
        report["outputs"].append({"id": cell_spec["id"], "path": str(out.relative_to(root)), "size": list(final.size), **stats})
        preview_tiles.append((cell_spec["id"], final.copy()))

    # Contact sheet for visual QA.
    tile = 192
    preview = Image.new("RGBA", (cols * tile, rows * (tile + 24)), (20, 18, 35, 255))
    draw = ImageDraw.Draw(preview)
    for i, (item_id, image) in enumerate(preview_tiles):
        thumb = image.convert("RGBA"); thumb.thumbnail((tile - 12, tile - 12), Image.Resampling.LANCZOS)
        x = (i % cols) * tile + (tile - thumb.width) // 2
        y = (i // cols) * (tile + 24) + (tile - thumb.height) // 2
        preview.alpha_composite(thumb, (x, y)); draw.text(((i % cols) * tile + 4, (i // cols) * (tile + 24) + tile + 3), item_id, fill="white")
    preview_path = root / "assets" / "image2" / "previews" / f"{job_id}.png"
    preview_path.parent.mkdir(parents=True, exist_ok=True); preview.save(preview_path)
    report["preview"] = str(preview_path.relative_to(root))
    report_path = root / "assets" / "image2" / "reports" / f"{job_id}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--job-id", required=True)
    parser.add_argument("--edge-contract", action="store_true")
    parser.add_argument("--detect-tiles", action="store_true")
    args = parser.parse_args()
    report = process_job(args.manifest, args.job_id, args.edge_contract, args.detect_tiles)
    print(json.dumps({"job": report["job"], "outputs": len(report["outputs"]), "preview": report["preview"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
