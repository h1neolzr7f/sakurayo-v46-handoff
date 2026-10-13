#!/usr/bin/env python3
"""artpipeline — 把 AI 生成的原图变成游戏可用素材。

子命令：
    chroma   抠绿幕/纯色背景，输出透明 PNG
    trim     按 alpha 裁掉四周透明边
    pixel    像素量化（块平均，硬边方块）
    scale    按高度等比缩放
    frames   多张图横向拼成序列帧条带
    atlas    多张图打包成图集 + JSON 描述
    webp     批量转 WebP
    info     看一张图的尺寸/通道/包围盒

设计前提：只依赖 Pillow + numpy，不碰网络、不装额外二进制。
这台机器没有独立显卡，所有处理必须是纯 CPU 且确定性的。

示例：
    python artpipeline.py chroma raw/*.png -o keyed/ --despill 0.65
    python artpipeline.py trim keyed/*.png -o trimmed/ --pad 2
    python artpipeline.py frames trimmed/*.png -o walk_sheet.png --cols 8
    python artpipeline.py atlas trimmed/*.png -o atlas.png --json atlas.json --cell 256x256
    python artpipeline.py webp keyed/*.png -o webp/ --quality 88
"""

from __future__ import annotations

import argparse
import glob as globmod
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# ---------------------------------------------------------------- 基础


def iter_inputs(patterns: list[str]) -> list[Path]:
    """展开通配（由 shell 或这里处理），保持顺序稳定。

    用 glob.glob 而不是 Path.glob —— 后者不支持绝对路径模式。
    """
    out: list[Path] = []
    for p in patterns:
        path = Path(p)
        if path.is_dir():
            out.extend(sorted(path.iterdir()))
        elif any(ch in p for ch in "*?["):
            out.extend(sorted(Path(x) for x in globmod.glob(p)))
        else:
            out.append(path)
    seen = set()
    uniq = []
    for f in out:
        if f.is_file() and f.suffix.lower() in {".png", ".webp", ".jpg", ".jpeg", ".bmp", ".tga"}:
            if f not in seen:
                seen.add(f)
                uniq.append(f)
    if not uniq:
        sys.exit("没有找到输入图片")
    return uniq


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def save(img: Image.Image, out_dir: Path, stem: str, ext: str = ".png") -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / f"{stem}{ext}"
    img.save(target)
    return target


# ---------------------------------------------------------------- 抠像


def chroma_key(
    img: Image.Image,
    low: int = 14,
    high: int = 80,
    despill: float = 0.65,
    shrink: int = 0,
) -> Image.Image:
    """按「绿色优势值」抠像，而不是认死某一种绿。

    图生视频会把纯色背景重新打光成渐变，所以不能只匹配单一 RGB 值。
    判据：dominance = G - max(R, B)
        dominance <= low   -> 完全前景
        dominance >= high  -> 完全背景
        中间               -> 线性过渡
    despill 用来压掉边缘残留的绿色溢出；shrink 收缩前景边缘去掉绿边。
    """
    arr = np.asarray(img, dtype=np.float32)
    rgb = arr[..., :3]
    alpha_in = arr[..., 3:4]

    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dominance = g - np.maximum(r, b)

    span = max(1.0, float(high - low))
    mask = np.clip((float(high) - dominance) / span, 0.0, 1.0)
    alpha = mask[..., None] * 255.0 * (alpha_in / 255.0)

    out = rgb.copy()
    if despill > 0:
        # 绿色溢出去除：把 G 压到不超过 R/B 的最大值再加一点余量
        cap = np.maximum(r, b)
        spill = np.clip(g - cap, 0.0, None)
        out[..., 1] = g - spill * float(despill)

    result = np.concatenate([np.clip(out, 0, 255), np.clip(alpha, 0, 255)], axis=-1)

    # 可选：边缘收缩（腐蚀 alpha）
    if shrink > 0:
        a = result[..., 3]
        k = int(shrink)
        # 用简单的 3x3 腐蚀迭代 k 次，避免引入 scipy 依赖
        for _ in range(k):
            padded = np.pad(a, 1, mode="edge")
            stack = np.stack(
                [
                    padded[0:-2, 0:-2], padded[0:-2, 1:-1], padded[0:-2, 2:],
                    padded[1:-1, 0:-2], padded[1:-1, 1:-1], padded[1:-1, 2:],
                    padded[2:, 0:-2], padded[2:, 1:-1], padded[2:, 2:],
                ]
            )
            a = stack.min(axis=0)
        result[..., 3] = a

    return Image.fromarray(result.astype(np.uint8), "RGBA")


def bbox_of_alpha(img: Image.Image, threshold: int = 8) -> tuple[int, int, int, int] | None:
    arr = np.asarray(img)[..., 3]
    ys, xs = np.where(arr > threshold)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def trim_alpha(img: Image.Image, pad: int = 0, threshold: int = 8) -> Image.Image:
    box = bbox_of_alpha(img, threshold)
    if box is None:
        return img
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(img.width, x1 + pad), min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


# ---------------------------------------------------------------- 变换


_REMBG_SESSIONS: dict[str, object] = {}


def rembg_cut(img: Image.Image, model: str = "isnet-anime") -> Image.Image:
    """用 rembg 智能抠图，适合背景不是纯色的图。

    isnet-anime 是动漫/插画向模型，对二次元立绘最好。
    会话对象必须复用 —— 每张图重建 session 会反复加载模型，慢几百倍。
    首次调用需要下载模型权重（本机已缓存 isnet-anime）。
    """
    try:
        from rembg import new_session, remove
    except ImportError:
        sys.exit("需要 rembg：python -m pip install rembg")

    if model not in _REMBG_SESSIONS:
        _REMBG_SESSIONS[model] = new_session(model)
    return remove(img, session=_REMBG_SESSIONS[model])  # type: ignore[arg-type]


def _dilate(mask: np.ndarray, times: int = 1) -> np.ndarray:
    """3x3 膨胀 times 次。纯 numpy，不引 scipy。"""
    m = mask.copy()
    for _ in range(max(0, times)):
        p = np.pad(m, 1, mode="constant", constant_values=False)
        m = (
            p[0:-2, 0:-2] | p[0:-2, 1:-1] | p[0:-2, 2:]
            | p[1:-1, 0:-2] | p[1:-1, 1:-1] | p[1:-1, 2:]
            | p[2:, 0:-2] | p[2:, 1:-1] | p[2:, 2:]
        )
    return m


def hue_shift(img: Image.Image, degrees: float, sat: float = 1.0, val: float = 1.0) -> Image.Image:
    """HSV 空间旋转色相，可同时调饱和/明度。alpha 原样保留。

    从一套立绘变出一整套换色角色，成本为零 —— 比重新生图划算得多。
    对低饱和/低明度像素影响天然较小，所以阴影和高光不会被搅坏。
    """
    arr = np.asarray(img.convert("RGBA"), dtype=np.float32)
    rgb = Image.fromarray(arr[..., :3].astype(np.uint8), "RGB")
    hsv = np.asarray(rgb.convert("HSV"), dtype=np.float32)

    if degrees:
        hsv[..., 0] = (hsv[..., 0] + degrees / 360.0 * 255.0) % 255.0
    if sat != 1.0:
        hsv[..., 1] = np.clip(hsv[..., 1] * sat, 0, 255)
    if val != 1.0:
        hsv[..., 2] = np.clip(hsv[..., 2] * val, 0, 255)

    out_rgb = np.asarray(Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB"))
    out = np.concatenate([out_rgb, arr[..., 3:4]], axis=-1)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def hue_swap(
    img: Image.Image,
    src_center: float,
    target_center: float,
    src_width: float = 40.0,
    sat_min: float = 0.0,
    val_min: float = 0.0,
) -> Image.Image:
    """只把色相落在「源色相 ± src_width/2」的像素旋到目标色相，其他像素不动。

    这才是"换发色/换衣服色"的正确做法 —— 整图 hue 旋转会把皮肤也一并染绿。
    sat_min / val_min 用来排除灰阶（线稿、白底）和过暗（阴影）像素，避免误伤。
    色相是环形的，跨越 0/360 边界也能正确匹配。
    """
    arr = np.asarray(img.convert("RGBA"), dtype=np.float32)
    rgb = Image.fromarray(arr[..., :3].astype(np.uint8), "RGB")
    hsv = np.asarray(rgb.convert("HSV"), dtype=np.float32)

    h = hsv[..., 0] * (360.0 / 255.0)
    # 环形最短距离
    dist = np.abs((h - src_center + 180.0) % 360.0 - 180.0)
    mask = dist <= (src_width / 2.0)

    if sat_min > 0:
        mask &= hsv[..., 1] >= sat_min * 255.0
    if val_min > 0:
        mask &= hsv[..., 2] >= val_min * 255.0

    delta = (target_center - src_center) % 360.0
    new_h = (hsv[..., 0] + delta * (255.0 / 360.0)) % 255.0
    hsv[..., 0] = np.where(mask, new_h, hsv[..., 0])

    out_rgb = np.asarray(Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB"))
    out = np.concatenate([out_rgb, arr[..., 3:4]], axis=-1)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def dominant_hues(img: Image.Image, top: int = 6, sat_min: float = 0.15, val_min: float = 0.15) -> list[tuple[float, float]]:
    """统计主色相，返回 [(色相角度, 占比)]。

    换色前先跑这个，知道该填什么 src_center —— 不用靠眼睛猜。
    """
    arr = np.asarray(img.convert("RGBA"))
    alpha = arr[..., 3]
    rgb = Image.fromarray(arr[..., :3], "RGB")
    hsv = np.asarray(rgb.convert("HSV"), dtype=np.float32)

    visible = alpha > 32
    sat_ok = hsv[..., 1] >= sat_min * 255.0
    val_ok = hsv[..., 2] >= val_min * 255.0
    m = visible & sat_ok & val_ok

    h = (hsv[..., 0][m] * (360.0 / 255.0)).astype(np.int32)
    if h.size == 0:
        return []

    # 每 10 度一个桶
    bins = h // 10
    counts = np.bincount(bins, minlength=36)
    total = counts.sum()
    order = np.argsort(-counts)[:top]
    return [(float(b * 10 + 5), float(counts[b]) / total) for b in order if counts[b] > 0]


def tint(img: Image.Image, rgb: tuple[int, int, int], strength: float = 0.5) -> Image.Image:
    """按颜色染色，strength 0~1。只作用于不透明区域。"""
    arr = np.asarray(img.convert("RGBA"), dtype=np.float32)
    target = np.array(rgb, dtype=np.float32)
    mixed = arr[..., :3] * (1 - strength) + target * strength
    out = np.concatenate([np.clip(mixed, 0, 255), arr[..., 3:4]], axis=-1)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def add_outline(img: Image.Image, rgb: tuple[int, int, int] = (0, 0, 0), width: int = 2, threshold: int = 8) -> Image.Image:
    """给不透明区域加一圈外描边。做 UI 选中态 / 角色高亮很省事。"""
    arr = np.asarray(img.convert("RGBA"))
    alpha = arr[..., 3]
    mask = alpha > threshold
    ring = _dilate(mask, width) & ~mask

    out = np.zeros((*arr.shape[:2], 4), dtype=np.uint8)
    out[ring] = (rgb[0], rgb[1], rgb[2], 255)
    out[mask] = arr[mask]
    return Image.fromarray(out, "RGBA")


def add_shadow(img: Image.Image, offset: tuple[int, int] = (4, 4), blur: int = 3, opacity: float = 0.45) -> Image.Image:
    """给素材加投影。用 alpha 通道做，比真高斯快得多。"""
    arr = np.asarray(img.convert("RGBA"), dtype=np.float32)
    alpha = (arr[..., 3] > 8).astype(np.float32)

    # 简单多次膨胀当模糊
    pad = max(blur, 1)
    shifted = np.zeros_like(alpha)
    dx, dy = offset
    h, w = alpha.shape
    sx0, sy0 = max(0, dx), max(0, dy)
    sx1, sy1 = min(w, w + dx), min(h, h + dy)
    shifted[sy0:sy1, sx0:sx1] = alpha[max(0, -dy):max(0, -dy) + (sy1 - sy0),
                                      max(0, -dx):max(0, -dx) + (sx1 - sx0)]
    for _ in range(pad):
        shifted = _dilate(shifted > 0.5, 1).astype(np.float32)

    shadow_a = shifted * opacity * 255.0
    out = arr.copy()
    out[..., 3] = np.clip(arr[..., 3] + shadow_a * (1 - arr[..., 3] / 255.0), 0, 255)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def grid_split(img: Image.Image, cols: int, rows: int, names: list[str] | None = None) -> list[tuple[str, Image.Image]]:
    """把一张图按网格切开（图集的逆操作）。"""
    cw, ch = img.width // cols, img.height // rows
    out = []
    idx = 0
    for r in range(rows):
        for c in range(cols):
            cell = img.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            label = names[idx] if names and idx < len(names) else f"cell_{r}_{c}"
            out.append((label, cell))
            idx += 1
    return out


def compose_layers(canvas_size: tuple[int, int], layers: list[tuple[Image.Image, tuple[int, int]]]) -> Image.Image:
    """把多张图按 (x, y) 叠到一张画布上。做立绘换装 / 加装备。"""
    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    for im, (x, y) in layers:
        canvas.alpha_composite(im, (x, y))
    return canvas


def pixelate(img: Image.Image, block: int) -> Image.Image:
    """块平均后填满整块 —— 得到真正的硬边像素方块。

    这是确定性后处理，不依赖生图模型「愿意画像素画」。
    """
    if block <= 1:
        return img
    w, h = img.size
    sw, sh = max(1, w // block), max(1, h // block)
    small = img.resize((sw, sh), Image.BOX)
    return small.resize((w, h), Image.NEAREST)


def scale_to_height(img: Image.Image, height: int) -> Image.Image:
    if img.height == height:
        return img
    ratio = height / img.height
    return img.resize((max(1, round(img.width * ratio)), height), Image.LANCZOS)


def scale_to_fit(img: Image.Image, w: int, h: int, mode: str = "contain") -> Image.Image:
    if mode == "stretch":
        return img.resize((w, h), Image.LANCZOS)
    ratio = min(w / img.width, h / img.height)
    return img.resize((max(1, round(img.width * ratio)), max(1, round(img.height * ratio))), Image.LANCZOS)


def compose_frames(frames: list[Image.Image], cols: int | None = None, gap: int = 0) -> Image.Image:
    """横向（或按 cols 折行）拼成序列帧条带，所有帧先统一到最大尺寸。"""
    cw = max(f.width for f in frames)
    ch = max(f.height for f in frames)
    n = len(frames)
    cols = cols or n
    rows = (n + cols - 1) // cols

    sheet = Image.new("RGBA", (cols * cw + (cols - 1) * gap, rows * ch + (rows - 1) * gap), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        x = (i % cols) * (cw + gap)
        y = (i // cols) * (ch + gap)
        # 水平居中、底部对齐（脚底基准线一致）
        sheet.paste(f, (x + (cw - f.width) // 2, y + (ch - f.height)), f)
    return sheet


def pack_atlas(images: list[tuple[str, Image.Image]], cell: tuple[int, int] | None, cols: int | None) -> tuple[Image.Image, dict]:
    """网格图集 + JSON 描述。cell 给定时所有图先 contain 缩放进去。"""
    names = [n for n, _ in images]
    imgs = [i for _, i in images]

    if cell:
        cw, ch = cell
        imgs = [scale_to_fit(i, cw, ch, "contain") for i in imgs]
    cw = max(i.width for i in imgs)
    ch = max(i.height for i in imgs)

    n = len(imgs)
    cols = cols or int(np.ceil(np.sqrt(n)))
    rows = (n + cols - 1) // cols

    atlas = Image.new("RGBA", (cols * cw, rows * ch), (0, 0, 0, 0))
    frames = {}
    for idx, (name, im) in enumerate(zip(names, imgs)):
        x = (idx % cols) * cw
        y = (idx // cols) * ch
        px = x + (cw - im.width) // 2
        py = y + (ch - im.height) // 2
        atlas.paste(im, (px, py), im)
        frames[name] = {"x": px, "y": py, "w": im.width, "h": im.height}

    meta = {
        "image": "atlas.png",
        "cell": {"w": cw, "h": ch},
        "grid": {"cols": cols, "rows": rows, "count": n},
        "frames": frames,
    }
    return atlas, meta


# ---------------------------------------------------------------- CLI


def main() -> int:
    ap = argparse.ArgumentParser(description="AI 原图 -> 游戏素材 管线", formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("chroma", help="抠绿幕/纯色背景")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="keyed")
    p.add_argument("--low", type=int, default=14)
    p.add_argument("--high", type=int, default=80)
    p.add_argument("--despill", type=float, default=0.65)
    p.add_argument("--shrink", type=int, default=0)

    p = sub.add_parser("trim", help="裁掉透明边")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="trimmed")
    p.add_argument("--pad", type=int, default=0)

    p = sub.add_parser("rmbg", help="AI 智能抠图（适合非纯色背景）")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="cutout")
    p.add_argument("--model", default="isnet-anime")

    p = sub.add_parser("pixel", help="像素量化")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="pixel")
    p.add_argument("--block", type=int, default=4)

    p = sub.add_parser("scale", help="等比缩放到指定高度")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="scaled")
    p.add_argument("--height", type=int, required=True)

    p = sub.add_parser("frames", help="拼序列帧条带")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", required=True)
    p.add_argument("--cols", type=int)
    p.add_argument("--gap", type=int, default=0)

    p = sub.add_parser("atlas", help="打包图集 + JSON")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", required=True)
    p.add_argument("--json", dest="json_out")
    p.add_argument("--cell", help="每格尺寸，如 256x256")
    p.add_argument("--cols", type=int)

    p = sub.add_parser("webp", help="批量转 WebP")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="webp")
    p.add_argument("-q", "--quality", type=int, default=88)
    p.add_argument("--lossless", action="store_true")
    p.add_argument("--max-width", type=int)

    p = sub.add_parser("swap", help="只换指定色相（换发色/衣服色，不动皮肤）")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="swapped")
    p.add_argument("--from-hue", dest="from_hue", type=float, required=True, help="源色相角度 0-360")
    p.add_argument("--to-hue", dest="to_hue", type=float, required=True, help="目标色相角度 0-360")
    p.add_argument("--width", type=float, default=40.0, help="源色相容差（度）")
    p.add_argument("--sat-min", dest="sat_min", type=float, default=0.15)
    p.add_argument("--val-min", dest="val_min", type=float, default=0.15)

    p = sub.add_parser("hues", help="统计主色相（换色前先跑，别靠眼睛猜）")
    p.add_argument("inputs", nargs="+")
    p.add_argument("--top", type=int, default=6)
    p.add_argument("-o", "--out", default=".", help="未使用，仅保持参数一致")

    p = sub.add_parser("hue", help="色相旋转换色（从已有素材变新配色，零成本）")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="recolored")
    p.add_argument("--degrees", type=float, required=True)
    p.add_argument("--sat", type=float, default=1.0)
    p.add_argument("--val", type=float, default=1.0)

    p = sub.add_parser("sweep", help="一次生成一套色相变体（扫一圈色环）")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="sweep")
    p.add_argument("--step", type=float, default=60.0, help="色相步长（度）")
    p.add_argument("--sat", type=float, default=1.0)
    p.add_argument("--val", type=float, default=1.0)

    p = sub.add_parser("tint", help="按颜色染色")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="tinted")
    p.add_argument("--rgb", required=True, help="如 255,80,120")
    p.add_argument("--strength", type=float, default=0.5)

    p = sub.add_parser("outline", help="加外描边（UI 选中态 / 高亮）")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="outlined")
    p.add_argument("--rgb", default="0,0,0")
    p.add_argument("--width", type=int, default=2)

    p = sub.add_parser("shadow", help="加投影")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="shadowed")
    p.add_argument("--offset", default="4,4")
    p.add_argument("--blur", type=int, default=3)
    p.add_argument("--opacity", type=float, default=0.45)

    p = sub.add_parser("flip", help="水平/垂直翻转")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="flipped")
    p.add_argument("--axis", choices=["h", "v", "both"], default="h")

    p = sub.add_parser("grid", help="按网格切图（图集拆帧）")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="cells")
    p.add_argument("--cols", type=int, required=True)
    p.add_argument("--rows", type=int, required=True)

    p = sub.add_parser("info", help="看图信息")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default=".", help="未使用，仅保持参数一致")

    args = ap.parse_args()

    files = iter_inputs(args.inputs)
    out = Path(args.out)

    def parse_rgb(s: str) -> tuple[int, int, int]:
        p = [int(x) for x in s.split(",")]
        while len(p) < 3:
            p.append(0)
        return (p[0], p[1], p[2])

    if args.cmd == "swap":
        for f in files:
            img = hue_swap(load_rgba(f), args.from_hue, args.to_hue, args.width, args.sat_min, args.val_min)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst}  ({args.from_hue:.0f} -> {args.to_hue:.0f} deg, +-{args.width/2:.0f})")
        return 0

    if args.cmd == "hues":
        for f in files:
            print(f"  {f.name}:")
            for ang, ratio in dominant_hues(load_rgba(f), args.top):
                print(f"      {ang:6.0f} deg    {ratio*100:5.1f}%")
        return 0

    if args.cmd == "hue":
        for f in files:
            img = hue_shift(load_rgba(f), args.degrees, args.sat, args.val)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst}  ({args.degrees:+.0f} deg)")
        return 0

    if args.cmd == "sweep":
        n = max(1, round(360 / args.step))
        for f in files:
            for i in range(n):
                deg = i * args.step
                img = hue_shift(load_rgba(f), deg, args.sat, args.val)
                save(img, out / f"{int(deg):03d}", f.stem)
            print(f"  {f.name} -> {out}  ({n} 个变体，步长 {args.step:g} 度)")
        return 0

    if args.cmd == "tint":
        rgb = parse_rgb(args.rgb)
        for f in files:
            img = tint(load_rgba(f), rgb, args.strength)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst}")
        return 0

    if args.cmd == "outline":
        rgb = parse_rgb(args.rgb)
        for f in files:
            img = add_outline(load_rgba(f), rgb, args.width)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst}  (描边 {args.width}px)")
        return 0

    if args.cmd == "shadow":
        off = parse_rgb(args.offset)[:2]
        for f in files:
            img = add_shadow(load_rgba(f), (off[0], off[1]), args.blur, args.opacity)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst}")
        return 0

    if args.cmd == "flip":
        for f in files:
            img = load_rgba(f)
            if args.axis in ("h", "both"):
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
            if args.axis in ("v", "both"):
                img = img.transpose(Image.FLIP_TOP_BOTTOM)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst}  (axis={args.axis})")
        return 0

    if args.cmd == "grid":
        for f in files:
            cells = grid_split(load_rgba(f), args.cols, args.rows)
            for label, cell in cells:
                save(cell, out, f"{f.stem}_{label}")
            print(f"  {f.name} -> {out}  ({len(cells)} 格)")
        return 0

    if args.cmd == "info":
        for f in iter_inputs(args.inputs):
            im = load_rgba(f)
            box = bbox_of_alpha(im)
            print(f"{f.name}: {im.width}x{im.height}  bbox={box}  {f.stat().st_size/1024:.1f} KB")
        return 0

    if args.cmd == "chroma":
        for f in files:
            img = chroma_key(load_rgba(f), args.low, args.high, args.despill, args.shrink)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst}")
        return 0

    if args.cmd == "trim":
        for f in files:
            img = trim_alpha(load_rgba(f), args.pad)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst} ({img.width}x{img.height})")
        return 0

    if args.cmd == "rmbg":
        for f in files:
            img = rembg_cut(load_rgba(f), args.model)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst}")
        return 0

    if args.cmd == "pixel":
        for f in files:
            img = pixelate(load_rgba(f), args.block)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst}")
        return 0

    if args.cmd == "scale":
        for f in files:
            img = scale_to_height(load_rgba(f), args.height)
            dst = save(img, out, f.stem)
            print(f"  {f.name} -> {dst} ({img.width}x{img.height})")
        return 0

    if args.cmd == "frames":
        frames = [load_rgba(f) for f in files]
        sheet = compose_frames(frames, args.cols, args.gap)
        dst = Path(args.out)
        dst.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(dst)
        print(f"  {len(frames)} 帧 -> {dst} ({sheet.width}x{sheet.height})")
        return 0

    if args.cmd == "atlas":
        cell = None
        if args.cell:
            cw, ch = args.cell.lower().split("x")
            cell = (int(cw), int(ch))
        imgs = [(f.stem, load_rgba(f)) for f in files]
        atlas, meta = pack_atlas(imgs, cell, args.cols)
        dst = Path(args.out)
        dst.parent.mkdir(parents=True, exist_ok=True)
        atlas.save(dst)
        meta["image"] = dst.name
        json_path = Path(args.json_out) if args.json_out else dst.with_suffix(".json")
        json_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  {len(imgs)} 图 -> {dst} ({atlas.width}x{atlas.height}) + {json_path}")
        return 0

    if args.cmd == "webp":
        out.mkdir(parents=True, exist_ok=True)
        total_in = total_out = 0
        for f in files:
            img = load_rgba(f)
            if args.max_width and img.width > args.max_width:
                ratio = args.max_width / img.width
                img = img.resize((args.max_width, max(1, round(img.height * ratio))), Image.LANCZOS)
            dst = out / f"{f.stem}.webp"
            img.save(dst, "WEBP", quality=args.quality, lossless=args.lossless, method=6)
            total_in += f.stat().st_size
            total_out += dst.stat().st_size
        saved = 100 * (1 - total_out / max(1, total_in))
        print(f"  {len(files)} 张 -> {out}  {total_in/1024:.0f} KB -> {total_out/1024:.0f} KB (省 {saved:.1f}%)")
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
