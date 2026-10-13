"""为「视频看板娘」制作首帧：抠出角色立绘 + 合成大厅夜景背景（2:3 竖构图）。

规格见 docs/MASCOT_VIDEO.md：
- 画面必须 2:3 竖构图，人物从头到膝/全身，脚底与画面底边对齐
- 背景不能是纯色/透明，要带大厅同色系夜景
- 角色在所有片段里位置、大小一致（所以首帧必须由同一张图生成）

立绘本身是 1024x1536（正好 2:3）纯白底，所以：抠图 -> 贴到裁好的夜景 2:3 画布上。
全程本地计算，不调用任何 API。
"""

import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

ART = Path(
    r"E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art"
)
OUT = Path(r"E:\deepseek工作区\game-lab\assets\mascot-frames")
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1024, 1536  # 2:3
BG_FILE = ART / "ui" / "lobby_wide.webp"  # 1600x900 夜景
CHARACTERS = ["sayo", "aya", "rion"]


def crop_to_23(bg: Image.Image, focus_x: float = 0.60) -> Image.Image:
    """从横构图背景里裁一块 2:3 竖区域并缩放到目标尺寸。

    focus_x 决定裁切位置（0=最左，1=最右），默认偏右取霓虹城市那一侧作远景。
    """
    bw, bh = bg.size
    target = W / H
    cw = int(bh * target)
    if cw <= bw:
        ch = bh
    else:
        cw = bw
        ch = int(cw / target)
    x = int((bw - cw) * focus_x)
    y = int((bh - ch) * 0.5)
    return bg.crop((x, y, x + cw, y + ch)).resize((W, H), Image.LANCZOS)


def main() -> int:
    if not BG_FILE.exists():
        print(f"背景不存在: {BG_FILE}")
        return 1

    print("加载抠图模型 (isnet-anime)...")
    session = new_session("isnet-anime")

    bg = Image.open(BG_FILE).convert("RGB")
    canvas_bg = crop_to_23(bg)
    print(f"背景: {bg.size} -> 裁成 {canvas_bg.size} (2:3)")

    ok = 0
    for cid in CHARACTERS:
        src = ART / "characters" / cid / "default" / "lobby_idle.webp"
        if not src.exists():
            print(f"  跳过 {cid}: 立绘不存在")
            continue

        im = Image.open(src).convert("RGBA")
        cut = remove(im, session=session, alpha_matting=False)

        # 抠图后统计不透明像素占比，作为质量指标（角色应占画面相当比例）
        alpha = cut.split()[3]
        opaque = sum(1 for p in alpha.getdata() if p > 32)
        ratio = opaque / (cut.width * cut.height) * 100

        frame = canvas_bg.copy()
        frame.paste(cut, (0, 0), cut)
        out = OUT / f"{cid}_frame.png"
        frame.save(out)
        print(
            f"  {cid:5} 角色占比 {ratio:5.1f}%  ->  {out.name}  {out.stat().st_size / 1024:.0f} KB"
        )
        ok += 1

    print(f"\n完成 {ok}/{len(CHARACTERS)}，输出目录: {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
