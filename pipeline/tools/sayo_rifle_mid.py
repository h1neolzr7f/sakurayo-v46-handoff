"""小夜抬枪：只重绘步枪和两只握拳的手，脸和背景保持原像素。

首帧和末帧都用现成的看板娘静帧。中间帧从同一张图做 mask 编辑，
让枪管小幅上抬，双手保持握拳，不张开手指。
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from masked_edit import UA, BASE, KEY, PROXY, compare

SRC = Path(r"E:\deepseek工作区\game-lab\assets\mascot-frames\sayo_frame.png")
OUT = Path(r"E:\deepseek工作区\game-lab\assets\keyframes\sayo-rifle-lively")

PROMPT = (
    "Inside the white masked area only, change her pose into a lively ready stance. "
    "Swing the one rifle up until the barrel is nearly horizontal across her chest. "
    "Erase the rifle from its old steep diagonal and repaint the clothes behind it. "
    "Her shoulders open, the wide sleeves flare outward, and the loose hair swings to one side. "
    "Draw exactly one rifle, not two. "
    "Both hands are fully covered by the same black gloves. All fingers stay hidden inside the gloves, "
    "curled into fists: one fist on the handguard, one fist on the pistol grip. "
    "No skin, no fingernails, no pointing finger, no extra hand. "
    "Keep the same white sakura rifle and the same sharp line weight. "
    "No text, no watermark, no blur, no haze."
)


def build_mask(src: Image.Image) -> Image.Image:
    w, h = src.size
    layer = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(layer)
    # 沿枪身一条宽带，上方留出抬枪后的落点
    # 旧枪身要能被擦掉，抬高后的枪管也必须落在白色区域内
    # 旧枪身、抬平后的枪、两侧袖子都要能重绘。脸留在外面。
    draw.polygon([(40, 430), (980, 430), (1020, 1180), (0, 1180)], fill=255)
    draw.ellipse((0, 180, 280, 720), fill=255)
    draw.ellipse((760, 160, 1024, 780), fill=255)
    layer = layer.filter(ImageFilter.MaxFilter(5))
    arr = np.array(layer)
    arr[:200, :] = 0
    arr[160:520, 250:790] = 0  # 脸
    arr[1180:, :] = 0
    rgba = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    white = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    return Image.composite(white, rgba, Image.fromarray(arr))


def call(image: Path, mask: Path) -> dict:
    import json
    import subprocess

    cmd = [
        "curl.exe", "-s", "--proxy", PROXY, "--max-time", "420", "-A", UA,
        "-X", "POST", f"{BASE}/images/edits",
        "-H", f"Authorization: Bearer {KEY}",
        "-F", "model=gpt-image-2.5",
        "-F", f"image=@{image}",
        "-F", f"mask=@{mask}",
        "-F", f"prompt={PROMPT}",
        "-F", "size=1024x1536",
        "-F", "n=2",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = (r.stdout or "").strip()
    if not out.startswith("{"):
        raise SystemExit(f"非 JSON 响应: {out[:400]}")
    j = json.loads(out)
    if "data" not in j:
        raise SystemExit(f"接口报错: {json.dumps(j, ensure_ascii=False)[:500]}")
    return j


def crops(im: Image.Image, stem: str) -> None:
    boxes = {
        "hand-guard": (240, 600, 560, 900),
        "hand-grip": (560, 740, 860, 1040),
        "face": (330, 120, 760, 500),
        "muzzle": (760, 900, 1024, 1200),
    }
    for name, box in boxes.items():
        im.crop(box).save(OUT / f"check-{stem}-{name}.png")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    mask = build_mask(src)
    mask_path = OUT / "mask.png"
    mask.save(mask_path)
    covered = int((np.array(mask.split()[-1]) > 127).mean() * 100)
    print(f"mask 覆盖 {covered}%")

    start = OUT / "01-start.png"
    end = OUT / "03-end.png"
    src.save(start)
    src.save(end)

    print("调用 /images/edits ...")
    resp = call(start, mask_path)
    import base64
    crops(Image.open(start).convert("RGB"), "start")
    for i, item in enumerate(resp["data"], 1):
        raw = base64.b64decode(item["b64_json"])
        mid = OUT / f"02-mid-{i}.png"
        mid.write_bytes(raw)
        print(f"候选 {i}: {mid.stat().st_size/1024:.0f} KB")
        crops(Image.open(mid).convert("RGB"), f"mid-{i}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
