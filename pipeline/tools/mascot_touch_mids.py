"""点按差分的中间帧。首尾都是身份静帧，只动原项目里那个部位。

  sayo-hair   点头：头发甩到一侧，双手留在枪上
  sayo-skirt  点身体：裙摆和衣摆摆开，枪和手不动
  aya-ribbon  点头：空着的那只手去碰蓝发带，枪留在另一只手
  rion-hair   点头：长发和红绳甩开，双手留在刀上
"""

import base64
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from masked_edit import BASE, KEY, PROXY, UA

ROOT = Path(r"E:\deepseek工作区\game-lab\assets")
FRAMES = ROOT / "mascot-frames"


def mask_rgba(src: Image.Image, polygons, locks) -> Image.Image:
    layer = Image.new("L", src.size, 0)
    draw = ImageDraw.Draw(layer)
    for poly in polygons:
        draw.polygon(poly, fill=255)
    arr = np.array(layer)
    for box in locks:
        x0, y0, x1, y1 = box
        arr[y0:y1, x0:x1] = 0
    layer = Image.fromarray(arr).filter(ImageFilter.MaxFilter(3))
    rgba = Image.new("RGBA", src.size, (0, 0, 0, 0))
    white = Image.new("RGBA", src.size, (255, 255, 255, 255))
    return Image.composite(white, rgba, layer)


def restore_outside(original: Image.Image, edited: Image.Image, mask: Image.Image) -> Image.Image:
    src = original.convert("RGB")
    dst = edited.convert("RGB").resize(src.size, Image.Resampling.LANCZOS)
    keep = mask.split()[-1].resize(src.size, Image.Resampling.NEAREST).filter(ImageFilter.GaussianBlur(2))
    return Image.composite(dst, src, keep)


JOBS = {
    "sayo-hair": {
        "src": FRAMES / "sayo_frame.png",
        "polygons": [
            [(40, 20), (400, 10), (420, 420), (240, 640), (20, 520)],
            [(680, 20), (1020, 10), (1024, 860), (760, 820), (620, 280)],
        ],
        "locks": [(300, 80, 720, 460)],
        "prompt": (
            "Inside the white masked area only, swing her long hair strongly to her right, "
            "the flower pin and loose strands travel with the hair. "
            "Do not add a hand into the hair. Both hands stay off this area. "
            "No extra fingers, no second rifle, no text, no blur."
        ),
    },
    "sayo-skirt": {
        "src": FRAMES / "sayo_frame.png",
        "polygons": [
            [(0, 400), (460, 360), (520, 760), (640, 1100), (700, 1536), (0, 1536)],
        ],
        "locks": [(0, 0, 1024, 390), (400, 560, 980, 980)],
        "prompt": (
            "Inside the white masked area only, make a large readable motion: "
            "the left white sakura sleeve balloons far into the empty space on the left, "
            "and the navy pleated skirt flares hard to the left so the hem silhouette is obviously different. "
            "This must be a big gust, not a small twitch. "
            "Keep the same outfit colors. Both gloved hands and the rifle stay outside this change. "
            "Do not add a hand, a leg, or a second rifle. No text, no blur."
        ),
    },
    "aya-ribbon": {
        "src": FRAMES / "aya_frame.png",
        "polygons": [
            [(500, 180), (940, 120), (1020, 560), (1000, 1480), (680, 1480), (480, 1080), (420, 640)],
        ],
        "locks": [(0, 0, 430, 1536), (300, 60, 640, 430)],
        "prompt": (
            "Inside the white masked area only, raise her left hand from the katana "
            "up to the blue hair ribbon and pinch the ribbon with a closed black glove. "
            "All fingers stay hidden in the glove. Erase that hand from its old place on the scabbard. "
            "The katana stays sheathed. Exactly one sword, no second pistol, no extra hand. "
            "No text, no blur."
        ),
    },
    "rion-hair": {
        "src": FRAMES / "rion_frame.png",
        "polygons": [
            [(0, 0), (340, 0), (420, 900), (0, 1100)],
            [(680, 0), (1024, 0), (1024, 1200), (700, 980)],
        ],
        "locks": [(300, 40, 740, 430), (180, 520, 820, 1080)],
        "prompt": (
            "Inside the white masked area only, whip her long black hair and the red hair ribbons "
            "hard to one side. Do not move her hands or the sword. "
            "No extra hand, no second sword, no peace sign, no text, no blur."
        ),
    },
}


def preview(name: str) -> None:
    job = JOBS[name]
    out = ROOT / "keyframes" / name
    out.mkdir(parents=True, exist_ok=True)
    src = Image.open(job["src"]).convert("RGB")
    mask = mask_rgba(src, job["polygons"], job["locks"])
    mask.save(out / "mask.png")
    src.save(out / "01-start.png")
    src.save(out / "03-end.png")
    red = Image.new("RGBA", src.size, (255, 40, 40, 110))
    tint = Image.composite(red, Image.new("RGBA", src.size, (0, 0, 0, 0)), mask.split()[-1])
    Image.alpha_composite(src.convert("RGBA"), tint).convert("RGB").resize((360, 540)).save(out / "mask-preview.png")
    covered = int((np.array(mask.split()[-1]) > 127).mean() * 100)
    print(f"{name} mask {covered}%", flush=True)


def call(image: Path, mask: Path, prompt: str) -> dict:
    cmd = [
        "curl.exe", "-s", "--proxy", PROXY, "--max-time", "420", "-A", UA,
        "-X", "POST", f"{BASE}/images/edits",
        "-H", f"Authorization: Bearer {KEY}",
        "-F", "model=gpt-image-2.5",
        "-F", f"image=@{image}",
        "-F", f"mask=@{mask}",
        "-F", f"prompt={prompt}",
        "-F", "size=1024x1536",
        "-F", "n=1",
    ]
    last = ""
    for attempt in range(1, 4):
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        out = (r.stdout or "").strip()
        last = out[:180].replace("\n", " ")
        if out.startswith("{"):
            data = json.loads(out)
            if "data" in data:
                return data
            last = json.dumps(data, ensure_ascii=False)[:180]
        print(f"  第 {attempt} 次失败: {last}", flush=True)
        if attempt < 3:
            import time
            time.sleep(8)
    raise SystemExit(f"编辑失败: {last}")


def run(name: str) -> None:
    preview(name)
    job = JOBS[name]
    out = ROOT / "keyframes" / name
    print(f"{name} 调用 /images/edits ...", flush=True)
    resp = call(out / "01-start.png", out / "mask.png", job["prompt"])
    raw_path = out / "02-raw.png"
    raw_path.write_bytes(base64.b64decode(resp["data"][0]["b64_json"]))
    mid = restore_outside(Image.open(out / "01-start.png"), Image.open(raw_path), Image.open(out / "mask.png"))
    mid.save(out / "02-mid.png")
    print(f"{name} 中间帧 {(out / '02-mid.png').stat().st_size / 1024:.0f} KB", flush=True)


if __name__ == "__main__":
    args = sys.argv[1:]
    send = "--send" in args
    names = [a for a in args if not a.startswith("--")] or list(JOBS)
    for name in names:
        if send:
            run(name)
        else:
            preview(name)
