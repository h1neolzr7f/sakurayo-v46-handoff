import os
"""多图垫图生成器 —— 角色图 + 风格参考图一起送进 /images/edits。

为什么需要它：
  DSH 的 edit_image 工具只接受单张 source_image，做不了「内容图 + 风格垫图」。
  实测中转站的 /images/edits 接受 `image[]` 数组形式的多图输入，因此绕过工具直连。

用法：
  python styled_gen.py <角色图> <输出名> <prompt文件> [--style 风格图] [--size 1024x1536] [--keep-both]

约定：
  - 第一张图 = 角色内容图（<IMAGE_0>）
  - 第二张图 = 风格参考图（<IMAGE_1>），prompt 里用 <IMAGE_1> 引用它
  - 图片按顺序用 <IMAGE_0> / <IMAGE_1> 在 prompt 中引用
"""

import argparse
import base64
import json
import subprocess
import sys
from pathlib import Path

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

STYLE_DEFAULT = Path(r"E:\deepseek工作区\game-lab\assets\style-ref\style-ref-01.png")
OUT_DIR = Path(r"E:\deepseek工作区\game-lab\assets\output")


def run(images: list[Path], prompt: str, size: str, n: int = 1) -> dict:
    cmd = ["curl.exe", "-s", "--proxy", PROXY, "--max-time", "420", "-A", UA,
           "-X", "POST", f"{BASE}/images/edits",
           "-H", f"Authorization: Bearer {KEY}",
           "-F", "model=gpt-image-2.5"]
    for img in images:
        cmd += ["-F", f"image[]=@{img}"]
    cmd += ["-F", f"prompt={prompt}", "-F", f"size={size}", "-F", f"n={n}"]

    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = (r.stdout or "").strip()
    if not out.startswith("{"):
        raise SystemExit(f"非 JSON 响应: {out[:400]}")
    j = json.loads(out)
    if "data" not in j:
        raise SystemExit(f"接口报错: {json.dumps(j, ensure_ascii=False)[:400]}")
    return j


def save(j: dict, stem: str) -> list[Path]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    saved = []
    for i, item in enumerate(j["data"], 1):
        raw = base64.b64decode(item["b64_json"])
        p = OUT_DIR / f"{stem}-{i}.png"
        p.write_bytes(raw)
        saved.append(p)
    return saved


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("character", help="角色内容图路径")
    ap.add_argument("stem", help="输出文件名前缀")
    ap.add_argument("prompt", help="prompt 文件路径，或直接给 --text")
    ap.add_argument("--style", default=str(STYLE_DEFAULT), help="风格垫图路径")
    ap.add_argument("--text", action="store_true", help="把 prompt 参数当作正文而非文件")
    ap.add_argument("--size", default="1024x1536")
    ap.add_argument("--n", type=int, default=1)
    ap.add_argument("--no-style", action="store_true", help="不用垫图，仅单图")
    args = ap.parse_args()

    char = Path(args.character)
    if not char.exists():
        raise SystemExit(f"角色图不存在: {char}")

    images = [char]
    if not args.no_style:
        st = Path(args.style)
        if not st.exists():
            raise SystemExit(f"垫图不存在: {st}")
        images.append(st)

    prompt = args.prompt if args.text else Path(args.prompt).read_text(encoding="utf-8")

    print(f"输入图 {len(images)} 张:")
    for i, im in enumerate(images):
        print(f"  <IMAGE_{i}> {im.name}")
    print(f"尺寸 {args.size}  n={args.n}  输出前缀 {args.stem}")

    j = run(images, prompt, args.size, args.n)
    saved = save(j, args.stem)
    for p in saved:
        print(f"  -> {p.name}  {p.stat().st_size/1024:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
