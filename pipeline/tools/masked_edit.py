import os
"""用 /images/edits + mask 做真正的局部修图（DSH edit_image 工具不支持 mask）。

验证要点：
  - 只有 mask 白色区域会被重绘，其余像素应保持原样
  - 对比原图与结果，确认非 mask 区域的像素差异接近 0
"""

import base64
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops
import numpy as np

D = Path(r"E:\deepseek工作区\game-lab\assets\_repair")
KEY = os.environ.get("LITANGKING_KEY", "")
if not KEY:
    # 回退：从本机 DSH 设置读取，不把密钥写进仓库
    import re as _re
    import pathlib as _pl
    try:
        _m = _re.search(r"litangking: (sk-[A-Za-z0-9]+)",
                        (_pl.Path.home() / ".dsh" / "settings.yaml").read_text(encoding="utf-8"))
        if _m:
            KEY = _m.group(1)
    except Exception:
        pass
BASE = "https://litangking.12gg.workers.dev/v1"
PROXY = "http://127.0.0.1:7897"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36")


def build_mask(src_name: str, out_name: str, boxes: list[tuple[int, int, int, int]]) -> Path:
    """白=要重绘，透明=保留。用带 alpha 的 PNG（OpenAI 规范）。"""
    src = Image.open(D / src_name).convert("RGB")
    W, H = src.size
    layer = Image.new("L", (W, H), 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(layer)
    for b in boxes:
        d.rectangle(b, fill=255)
    rgba = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    white = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    merged = Image.composite(white, rgba, layer)
    p = D / out_name
    merged.save(p)
    return p


def call_edits(image: Path, mask: Path, prompt: str, size: str = "1024x1536") -> dict:
    cmd = [
        "curl.exe", "-s", "--proxy", PROXY, "--max-time", "300", "-A", UA,
        "-X", "POST", f"{BASE}/images/edits",
        "-H", f"Authorization: Bearer {KEY}",
        "-F", "model=gpt-image-2.5",
        "-F", f"image=@{image}",
        "-F", f"mask=@{mask}",
        "-F", f"prompt={prompt}",
        "-F", f"size={size}",
        "-F", "n=1",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = (r.stdout or "").strip()
    if not out.startswith("{"):
        raise SystemExit(f"非 JSON 响应: {out[:300]}")
    return json.loads(out)


def save_result(resp: dict, name: str) -> Path:
    item = resp["data"][0]
    raw = base64.b64decode(item["b64_json"])
    p = D / name
    p.write_bytes(raw)
    return p


def compare(a: Path, b: Path, mask: Path) -> None:
    """确认 mask 外的像素没被动过。"""
    ia = np.asarray(Image.open(a).convert("RGB"), dtype=np.int16)
    ib = np.asarray(Image.open(b).convert("RGB"), dtype=np.int16)
    m = np.asarray(Image.open(mask).convert("L"), dtype=np.uint8) > 127
    diff = np.abs(ia - ib).sum(axis=2)

    inside = diff[m].mean() if m.any() else 0
    outside = diff[~m].mean() if (~m).any() else 0
    outside_max = diff[~m].max() if (~m).any() else 0
    changed_outside = int((diff[~m] > 12).sum())

    print(f"  mask 内平均差异 : {inside:8.1f}  (应较大 -> 确实重绘了)")
    print(f"  mask 外平均差异 : {outside:8.2f}  (应接近 0 -> 其他地方没动)")
    print(f"  mask 外最大差异 : {outside_max:8d}")
    print(f"  mask 外变动像素 : {changed_outside:8d} / {int((~m).sum())}")


def main() -> int:
    print("== 1. 造 mask（只圈手）==")
    mask = build_mask(
        "sayo-orig.png", "sayo-hands-mask.png",
        [(215, 705, 615, 1015), (525, 935, 830, 1235)],
    )
    print(f"  {mask.name}")

    print("== 2. 调 /images/edits（image + mask）==")
    prompt = (
        "Repair ONLY the hands inside the masked area. Draw correct anime-style hand anatomy: "
        "exactly five fingers per hand, proper knuckle joints, natural finger length that tapers "
        "and is not elongated, small subtle fingernails, slight natural curl. "
        "The upper hand grips the white rifle body naturally with fingers wrapping around it. "
        "The lower hand supports the rifle from below with relaxed spread fingers overlapping the weapon. "
        "Match the surrounding illustration style, line weight and cel shading exactly. "
        "Do not alter anything outside the masked region."
    )
    resp = call_edits(D / "sayo-orig.png", mask, prompt)
    out = save_result(resp, "sayo-masked-edit.png")
    print(f"  -> {out.name} {out.stat().st_size/1024:.0f} KB")

    print("== 3. 像素级验证（mask 外是否被动）==")
    compare(D / "sayo-orig.png", out, mask)
    return 0


if __name__ == "__main__":
    sys.exit(main())
