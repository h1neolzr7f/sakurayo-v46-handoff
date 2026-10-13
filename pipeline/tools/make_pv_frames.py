"""把 Boss / 章节 CG 这类"白底或纯色底"的立绘处理成可做视频的首帧。

与看板娘首帧同思路：抠出主体 -> 合成到主题背景上。
Boss 走虚空主题（深紫黑 + 晶体光），让后续视频生成的"氛围"有依托。
"""

import sys
from pathlib import Path

from PIL import Image, ImageFilter
from rembg import new_session, remove

ART = Path(
    r"E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art"
)
OUT = Path(r"E:\deepseek工作区\game-lab\assets\pv-frames")
OUT.mkdir(parents=True, exist_ok=True)

# 输出的视频用 16:9（PV/过场是横屏播放）
W, H = 1280, 720


def make_void_bg() -> Image.Image:
    """程序生成虚空主题渐变背景（深紫 -> 黑），带径向光。用 numpy 向量化，别用逐像素循环。"""
    import numpy as np

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W * 0.5, H * 0.55
    maxd = float(np.hypot(max(cx, W - cx), max(cy, H - cy)))
    d = np.hypot(xx - cx, yy - cy) / maxd
    t = np.clip(1.0 - d * 1.25, 0.0, 1.0) ** 2

    r = np.clip(10 + 78 * t, 0, 255)
    g = np.clip(6 + 28 * t, 0, 255)
    b = np.clip(20 + 96 * t, 0, 255)
    arr = np.stack([r, g, b], axis=-1).astype(np.uint8)
    return Image.fromarray(arr, "RGB").filter(ImageFilter.GaussianBlur(2))


def compose(src: Path, out: Path, session, bg: Image.Image, scale: float = 0.86) -> None:
    im = Image.open(src).convert("RGBA")
    cut = remove(im, session=session, alpha_matting=False)

    # 主体缩放到画布高度的 scale 倍，底部对齐（Boss 压地面）
    target_h = int(H * scale)
    ratio = target_h / cut.height
    cut = cut.resize((max(1, int(cut.width * ratio)), target_h), Image.LANCZOS)

    canvas = bg.copy()
    x = (W - cut.width) // 2
    y = H - cut.height
    canvas.paste(cut, (x, y), cut)

    # 底部投一层紫色辉光，让主体不像"贴上去的"
    import numpy as np

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    band = np.clip((yy - H * 0.72) / (H * 0.28), 0.0, 1.0)
    fade = np.clip(1.0 - np.abs(xx - W * 0.5) / (W * 0.5), 0.0, 1.0)
    a = band * fade
    glow_arr = np.stack(
        [np.clip(120 * a, 0, 255), np.clip(40 * a, 0, 255), np.clip(180 * a, 0, 255)],
        axis=-1,
    ).astype(np.uint8)
    glow = Image.fromarray(glow_arr, "RGB").filter(ImageFilter.GaussianBlur(28))
    canvas = Image.blend(canvas, Image.blend(canvas, glow, 0.5), 0.45)

    canvas.save(out)
    print(f"  {out.name}  {canvas.size}  {out.stat().st_size / 1024:.0f} KB")


def main() -> int:
    print("加载抠图模型...")
    session = new_session("isnet-anime")
    bg = make_void_bg()
    bg.save(OUT / "_void_bg.png")
    print(f"  虚空背景 {bg.size} -> _void_bg.png")

    jobs = [
        (ART / "content-packs/maingod-void/bosses/void_phase2.webp", "boss_phase2"),
        (ART / "content-packs/maingod-void/bosses/void_phase3.webp", "boss_phase3"),
        (ART / "content-packs/maingod-void/bosses/void_phase4.webp", "boss_phase4"),
    ]
    for src, name in jobs:
        if not src.exists():
            print(f"  跳过 {name}: 源不存在")
            continue
        compose(src, OUT / f"{name}_frame.png", session, bg)

    print(f"\n输出目录: {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
