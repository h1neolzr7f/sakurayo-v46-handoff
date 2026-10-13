"""给缺技能帧、缺冲刺帧的换装，以及主神怪迈步帧，用 /images/edits 补图。

已有的 webp 会跳过，中断后可以接着跑。
角色贴在橙色底上编辑，再抠回透明，脚底对齐原来的待机帧。
"""

import base64
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image

from masked_edit import BASE, KEY, PROXY, UA

ART = Path(r"E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art")
ORANGE = (255, 122, 0)
LOG = Path(r"E:\deepseek工作区\game-lab\assets\keyframes\batch-sprite.log")


def log(msg: str) -> None:
    print(msg, flush=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")


def edits(image: Path, prompt: str, size: str, mask: Path | None = None) -> Image.Image:
    cmd = [
        "curl.exe", "-s", "--proxy", PROXY, "--max-time", "300", "-A", UA,
        "-X", "POST", f"{BASE}/images/edits",
        "-H", f"Authorization: Bearer {KEY}",
        "-F", "model=gpt-image-2.5",
        "-F", f"image=@{image}",
        "-F", f"prompt={prompt}",
        "-F", f"size={size}",
        "-F", "n=1",
    ]
    if mask is not None:
        cmd += ["-F", f"mask=@{mask}"]
    last = ""
    for attempt in range(1, 4):
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        out = (r.stdout or "").strip()
        last = out[:160].replace("\n", " ")
        if out.startswith("{"):
            data = json.loads(out)
            if "data" in data:
                raw = base64.b64decode(data["data"][0]["b64_json"])
                tmp = image.with_suffix(".edit.png")
                tmp.write_bytes(raw)
                return Image.open(tmp).convert("RGB")
            last = json.dumps(data, ensure_ascii=False)[:160]
        log(f"  retry {attempt}: {last}")
        time.sleep(6)
    raise RuntimeError(last)


def bbox(im: Image.Image):
    alpha = np.asarray(im.split()[-1])
    ys, xs = np.where(alpha > 24)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def on_orange(src: Image.Image, size: int = 1024) -> Image.Image:
    bg = Image.new("RGB", (size, size), ORANGE)
    up = src.convert("RGBA").resize((size, size), Image.Resampling.NEAREST)
    bg.paste(up, mask=up.split()[-1])
    return bg


def key_orange(im: Image.Image) -> Image.Image:
    rgb = np.asarray(im.convert("RGB"), dtype=np.int16)
    dist = np.abs(rgb - np.array(ORANGE)).sum(axis=2)
    alpha = np.clip((dist - 30) * (255 / 80), 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([np.asarray(im.convert("RGB")), alpha]), "RGBA")


def pin_feet(new: Image.Image, orig: Image.Image) -> Image.Image:
    ob = bbox(orig)
    nb = bbox(new)
    if not ob or not nb:
        raise RuntimeError("empty sprite")
    oh = max(1, ob[3] - ob[1])
    nh = max(1, nb[3] - nb[1])
    scale = oh / nh
    if not 0.62 <= scale <= 1.55:
        raise RuntimeError(f"scale {scale:.2f} out of range")
    cropped = new.crop(nb)
    resized = cropped.resize((max(1, int(cropped.width * scale)), max(1, int(cropped.height * scale))), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", orig.size, (0, 0, 0, 0))
    foot_x = (ob[0] + ob[2]) / 2
    foot_y = ob[3]
    x = int(foot_x - resized.width / 2)
    y = int(foot_y - resized.height + 1)
    canvas.paste(resized, (x, y), resized)
    return canvas


def save_webp(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=92, method=6)


POSE = {
    "anim_skill.webp": (
        "Change this into one big skill pose that is obviously different from standing idle. "
        "A wide stance, the weapon drives the action, and a bright effect in this outfit's own colors "
        "bursts around the figure. Keep the same chibi proportions, thick clean outlines, flat cel colors, "
        "same face, same hair, same clothes, and the same number of weapons. "
        "Feet stay near the same ground line. "
    ),
    "anim_dash.webp": (
        "Change this into one big dash pose that is obviously different from standing idle. "
        "The body leans hard forward, one leg stretches ahead, the other trails, hair and clothes stream backward. "
        "Keep the same chibi proportions, thick clean outlines, flat cel colors, "
        "same face, same hair, same clothes, and the same number of weapons. "
        "Feet stay near the same ground line. "
    ),
}


def sprite_jobs():
    jobs = []
    void = ART / "content-packs" / "maingod-void" / "enemies"
    for name, prompt in (
        ("voidling", "A clear walk step: weight on the other foot, the opposite arm swings forward. Same cat-eared girl, same purple kimono, same face, same size, same camera. "),
        ("voidmaw", "A clear walk step: one stubby foot forward, the round body leans with it. Same monster, same spiral mouth, same colors, same size, same camera. "),
    ):
        src = void / f"{name}.webp"
        dst = void / f"{name}_b.webp"
        jobs.append((src, dst, prompt + "Flat orange background stays #ff7a00. No text."))
    for idle in ART.glob("characters/*/*/anim_idle.webp"):
        for pose, hint in POSE.items():
            dst = idle.parent / pose
            if dst.exists():
                continue
            kind = idle.parent.name.replace("_", " ")
            prompt = (
                f"This is a chibi sprite of the same character wearing {kind}. "
                "Keep the same face, hair, outfit, weapon and colors. "
                + hint
                + "The background stays flat orange #ff7a00. No text, no watermark, no second character."
            )
            jobs.append((idle, dst, prompt))
    return jobs


def one(src: Path, dst: Path, prompt: str) -> None:
    if dst.exists():
        log(f"skip {dst.name}")
        return
    orig = Image.open(src).convert("RGBA")
    sheet = on_orange(orig)
    tmp = dst.with_suffix(".orange.png")
    sheet.save(tmp)
    edited = edits(tmp, prompt, "1024x1024")
    # 编辑结果往往不是 512。先缩回待机帧的画布，脚底对齐才不会把正常比例判成缩小一半。
    keyed = key_orange(edited.resize(orig.size, Image.Resampling.LANCZOS))
    placed = pin_feet(keyed, orig)
    save_webp(placed, dst)
    tmp.unlink(missing_ok=True)
    edit_png = tmp.with_suffix(".edit.png")
    if edit_png.exists():
        edit_png.unlink()
    log(f"ok {dst.relative_to(ART)}")


def main() -> None:
    jobs = sprite_jobs()
    if len(sys.argv) > 1:
        jobs = jobs[: int(sys.argv[1])]
    log(f"sprite jobs {len(jobs)}")
    done = 0
    for src, dst, prompt in jobs:
        try:
            one(src, dst, prompt)
            done += 1
        except Exception as exc:
            log(f"fail {dst.name}: {exc}")
    log(f"sprite done {done}/{len(jobs)}")


if __name__ == "__main__":
    main()
