"""artpipeline 自测：用合成素材把整条链路跑通，不依赖网络、不花钱。

造 4 张"假 AI 输出"（绿幕 #00ff00 背景 + 角色剪影 + 每张略微不同的姿态），
然后依次跑 chroma -> trim -> pixel -> frames -> atlas -> webp，并断言产物符合预期。
"""

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
WORK = ROOT / "_selftest_art"
PIPE = ROOT / "artpipeline.py"


def make_fake_ai_shot(i: int, size=(512, 512)) -> Path:
    """模拟一张 AI 输出：纯绿背景 + 一个简单角色形状。

    绿色用 #00FF00，和项目里约定的绿幕一致。
    """
    img = Image.new("RGB", size, (0, 255, 0))
    d = ImageDraw.Draw(img)
    cx, base = size[0] // 2, size[1] - 60
    sway = (i % 4) * 6 - 9                       # 每帧姿态略有差异
    d.ellipse([cx - 40 + sway, base - 300, cx + 40 + sway, base - 220], fill=(240, 200, 180))  # 头
    d.polygon([(cx - 55 + sway, base - 215), (cx + 55 + sway, base - 215),
               (cx + 70 + sway, base), (cx - 70 + sway, base)], fill=(60, 90, 160))            # 身体
    d.ellipse([cx - 52 + sway, base - 320, cx + 52 + sway, base - 250], fill=(30, 30, 40))     # 头发
    out = WORK / "raw" / f"pose_{i}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    return out


def run(*args: str) -> str:
    r = subprocess.run([sys.executable, str(PIPE), *args], capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        print("FAILED:", " ".join(args))
        print(r.stdout)
        print(r.stderr)
        raise SystemExit(1)
    return (r.stdout or "").strip()


def check(cond: bool, label: str) -> None:
    print(f"  {'PASS' if cond else 'FAIL'}  {label}")
    if not cond:
        raise SystemExit(1)


def main() -> int:
    if WORK.exists():
        shutil.rmtree(WORK)
    WORK.mkdir(parents=True)

    print("== 造 4 张假 AI 输出（512x512 绿幕）==")
    raws = [make_fake_ai_shot(i) for i in range(4)]
    print(f"  {len(raws)} 张 -> {raws[0].parent}")

    print("== 1. chroma 抠像 ==")
    print(run("chroma", str(WORK / "raw" / "*.png"), "-o", str(WORK / "keyed"), "--despill", "0.65"))
    keyed = sorted((WORK / "keyed").glob("*.png"))
    check(len(keyed) == 4, f"产出 4 张透明 PNG（实际 {len(keyed)}）")
    im = Image.open(keyed[0]).convert("RGBA")
    corner = im.getpixel((2, 2))
    check(corner[3] == 0, f"四角已透明 alpha={corner[3]}")
    center = im.getpixel((256, 400))
    check(center[3] > 200, f"角色本体保留 alpha={center[3]}")

    print("== 2. trim 裁边 ==")
    print(run("trim", str(WORK / "keyed" / "*.png"), "-o", str(WORK / "trimmed"), "--pad", "2"))
    trimmed = sorted((WORK / "trimmed").glob("*.png"))
    t0 = Image.open(trimmed[0])
    check(t0.width < 512 and t0.height < 512, f"已裁到内容包围盒 {t0.width}x{t0.height}")

    print("== 3. pixel 像素化 ==")
    print(run("pixel", str(WORK / "trimmed" / "*.png"), "-o", str(WORK / "pixel"), "--block", "4"))
    check(len(list((WORK / "pixel").glob("*.png"))) == 4, "4 张像素化产物")

    print("== 4. scale 统一高度 ==")
    print(run("scale", str(WORK / "pixel" / "*.png"), "-o", str(WORK / "scaled"), "--height", "256"))
    heights = {Image.open(p).height for p in (WORK / "scaled").glob("*.png")}
    check(heights == {256}, f"全部等高 256（实际 {heights}）")

    print("== 5. frames 序列帧条带 ==")
    print(run("frames", str(WORK / "scaled" / "*.png"), "-o", str(WORK / "walk_sheet.png"), "--cols", "4"))
    sheet = Image.open(WORK / "walk_sheet.png")
    scaled = sorted((WORK / "scaled").glob("*.png"))
    expect_w = sum(Image.open(p).width for p in scaled)
    expect_h = max(Image.open(p).height for p in scaled)
    check(sheet.width == expect_w and sheet.height == expect_h,
          f"条带尺寸 == 各帧之和 {sheet.width}x{sheet.height}（期望 {expect_w}x{expect_h}）")

    print("== 6. atlas 图集 + JSON ==")
    print(run("atlas", str(WORK / "scaled" / "*.png"), "-o", str(WORK / "atlas.png"),
              "--json", str(WORK / "atlas.json"), "--cell", "256x256", "--cols", "4"))
    check((WORK / "atlas.png").exists() and (WORK / "atlas.json").exists(), "atlas.png + atlas.json 都在")

    print("== 7. webp 批量转换 ==")
    print(run("webp", str(WORK / "keyed" / "*.png"), "-o", str(WORK / "webp"), "--quality", "88"))
    webs = sorted((WORK / "webp").glob("*.webp"))
    check(len(webs) == 4, f"4 张 WebP（实际 {len(webs)}）")
    png_kb = sum(p.stat().st_size for p in keyed) / 1024
    web_kb = sum(p.stat().st_size for p in webs) / 1024
    check(web_kb < png_kb, f"WebP 更小 {png_kb:.0f}KB -> {web_kb:.0f}KB")

    print("\n全链路通过。产物在", WORK)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
