"""看板娘进门招呼的中间帧。

首帧和末帧都是现成的身份静帧。中间帧只改一只手：
  绫：左手离开刀鞘，握拳抵在领口，算正式问候。手枪和刀留在原处。
  凛音：右手沿刀柄上滑到护手前，像要出鞘。刀不出鞘，另一只手不动。
接口不保证 mask 外像素不动，所以结果会把 mask 外整块贴回原图。
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


def mask_rgba(src: Image.Image, polygon, locks) -> Image.Image:
    layer = Image.new("L", src.size, 0)
    ImageDraw.Draw(layer).polygon(polygon, fill=255)
    arr = np.array(layer)
    for box in locks:
        x0, y0, x1, y1 = box
        arr[y0:y1, x0:x1] = 0
    layer = Image.fromarray(arr).filter(ImageFilter.MaxFilter(5))
    rgba = Image.new("RGBA", src.size, (0, 0, 0, 0))
    white = Image.new("RGBA", src.size, (255, 255, 255, 255))
    return Image.composite(white, rgba, layer)


def restore_outside(original: Image.Image, edited: Image.Image, mask: Image.Image) -> Image.Image:
    src = original.convert("RGB")
    dst = edited.convert("RGB").resize(src.size, Image.Resampling.LANCZOS)
    keep = mask.split()[-1].resize(src.size, Image.Resampling.NEAREST)
    return Image.composite(dst, src, keep)


JOBS = {
    "aya": {
        "src": FRAMES / "aya_frame.png",
        "out": ROOT / "keyframes" / "aya-greet",
        "polygon": [(500, 500), (880, 460), (990, 820), (820, 1280), (500, 1220), (420, 780)],
        "locks": [(0, 0, 1024, 470), (0, 0, 430, 1536), (0, 1240, 1024, 1536)],
        "prompt": (
            "Inside the white masked area only, raise her left hand from the katana hilt "
            "to her collar in a small formal salute. The black glove stays fully closed, "
            "all fingers hidden, no skin, no fingernails, no extra fingers. "
            "Erase that hand from its old place on the hilt. "
            "Keep exactly one katana sheathed at her hip. Do not draw the blade and do not add a second sword. "
            "The white jacket and blue trim stay the same. No text, no watermark, no blur."
        ),
    },
    "rion": {
        "src": FRAMES / "rion_frame.png",
        "out": ROOT / "keyframes" / "rion-greet",
        "polygon": [(150, 500), (560, 440), (640, 760), (500, 1040), (180, 980), (90, 720)],
        "locks": [(0, 0, 1024, 430), (640, 0, 1024, 1536), (0, 1080, 1024, 1536)],
        "prompt": (
            "Inside the white masked area only, slide her right hand up the same katana "
            "until the closed black glove rests on the guard, as if she is one motion away from drawing. "
            "All fingers stay hidden inside the glove. No open palm, no peace sign, no extra fingers. "
            "Erase the hand from its old place on the handle. "
            "The blade stays inside the scabbard. Exactly one sword, do not add another. "
            "No text, no watermark, no blur."
        ),
    },
}


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
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = (r.stdout or "").strip()
    if not out.startswith("{"):
        raise SystemExit(f"非 JSON 响应: {out[:300]}")
    j = json.loads(out)
    if "data" not in j:
        raise SystemExit(f"接口报错: {json.dumps(j, ensure_ascii=False)[:400]}")
    return j


def run(name: str) -> int:
    job = JOBS[name]
    out = job["out"]
    out.mkdir(parents=True, exist_ok=True)
    src = Image.open(job["src"]).convert("RGB")
    mask = mask_rgba(src, job["polygon"], job["locks"])
    mask.save(out / "mask.png")
    src.save(out / "01-start.png")
    src.save(out / "03-end.png")
    covered = int((np.array(mask.split()[-1]) > 127).mean() * 100)
    print(f"{name} mask 覆盖 {covered}%", flush=True)
    print(f"{name} 调用 /images/edits ...", flush=True)
    resp = call(out / "01-start.png", out / "mask.png", job["prompt"])
    raw = base64.b64decode(resp["data"][0]["b64_json"])
    edited = out / "02-raw.png"
    edited.write_bytes(raw)
    mid = restore_outside(src, Image.open(edited), mask)
    mid.save(out / "02-mid.png")
    print(f"{name} 中间帧 { (out / '02-mid.png').stat().st_size / 1024:.0f} KB", flush=True)
    return 0


if __name__ == "__main__":
    who = sys.argv[1:] or ["aya", "rion"]
    for name in who:
        run(name)
