"""商店皮肤的常服卡面。只调用 GPT /images/edits，不用 Grok。

局内 Q 版贴图不改。卡面已存在就跳过，一条只生成一次。
"""

import base64
import json
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image

from masked_edit import BASE, KEY, PROXY, UA

ART = Path(r"E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art")
GACHA = ART / "gacha"
WORK = Path(r"E:\deepseek工作区\game-lab\assets\keyframes\shop-cards")
LOG = WORK / "log.txt"
STYLE = GACHA / "fashion_sayo_plain.webp"

WHO = {
    "sayo": "the purple-haired shrine gunner with violet eyes and one white sakura assault rifle",
    "aya": "the silver-haired officer with blue eyes, a blue hair ribbon, one pistol and one sheathed katana",
    "rion": "the black-haired swordswoman with red eyes, red hair ribbons and one sheathed katana",
}
CLOTH = {
    "techcoat": "a long neon-cyan tactical trench coat with faint circuit lines",
    "biodress": "a crimson biotech gown with organic vein patterns",
    "psirobe": "a starlight-purple psychic robe with constellation trim",
    "idol": "an apocalyptic stage costume with bright panels and a short cape",
    "apron": "a practical alchemy apron over her clothes, with reagent bottles",
    "summon": "a loose ghost-summoning night robe covered in paper talismans",
    "haori": "a dark kendo-club haori with wide sleeves",
    "festival": "a red-and-white festival miko outfit with sakura cords and a flower pin",
}
JOBS = []
for face in ("sayo", "aya", "rion"):
    for skin in CLOTH:
        JOBS.append((f"shop_{face}_{skin}", face, skin))


def log(msg: str) -> None:
    print(msg, flush=True)
    WORK.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")


def sheet(idle: Path) -> Path:
    src = Image.open(idle).convert("RGBA")
    canvas = Image.new("RGB", (1024, 1536), (18, 12, 36))
    sprite = src.resize((720, 720), Image.Resampling.LANCZOS)
    canvas.paste(sprite, (152, 280), sprite.split()[-1])
    out = WORK / (idle.parent.parent.name + "_" + idle.parent.name + "_ref.png")
    canvas.save(out)
    return out


def full_mask(path: Path) -> Path:
    im = Image.open(path)
    mask = Image.new("RGBA", im.size, (255, 255, 255, 255))
    dest = path.with_name(path.stem + "_mask.png")
    mask.save(dest)
    return dest


def edits(images: list[Path], mask: Path, prompt: str) -> Image.Image:
    cmd = [
        "curl.exe", "-s", "--proxy", PROXY, "--max-time", "420", "-A", UA,
        "-X", "POST", f"{BASE}/images/edits",
        "-H", f"Authorization: Bearer {KEY}",
        "-F", "model=gpt-image-2.5",
        "-F", f"prompt={prompt}",
        "-F", "size=1024x1536",
        "-F", "n=1",
        "-F", f"mask=@{mask}",
    ]
    for image in images:
        cmd += ["-F", f"image[]=@{image}"]
    last = ""
    for attempt in range(1, 4):
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        out = (r.stdout or "").strip()
        last = out[:180].replace("\n", " ")
        if out.startswith("{"):
            data = json.loads(out)
            if "data" in data:
                raw = base64.b64decode(data["data"][0]["b64_json"])
                dest = WORK / "last_edit.png"
                dest.write_bytes(raw)
                return Image.open(dest).convert("RGB")
            last = json.dumps(data, ensure_ascii=False)[:180]
        log(f"  retry {attempt}: {last}")
        time.sleep(8)
    raise RuntimeError(last)


def to_card(im: Image.Image) -> Image.Image:
    w, h = im.size
    target_ratio = 768 / 1024
    ratio = w / h
    if ratio > target_ratio:
        nw = int(h * target_ratio)
        x = (w - nw) // 2
        im = im.crop((x, 0, x + nw, h))
    else:
        nh = int(w / target_ratio)
        y = (h - nh) // 2
        im = im.crop((0, y, w, y + nh))
    return im.resize((768, 1024), Image.Resampling.LANCZOS)


def one(card_id: str, face: str, skin: str) -> None:
    dest = GACHA / f"{card_id}.webp"
    if dest.exists() and dest.stat().st_size > 8000:
        log(f"skip {card_id}")
        return
    idle = ART / "characters" / face / skin / "anim_idle.webp"
    ref = sheet(idle)
    style = WORK / "style.png"
    if not style.exists():
        Image.open(STYLE).convert("RGB").resize((1024, 1536), Image.Resampling.LANCZOS).save(style)
    prompt = (
        f"Redraw the whole picture as one normal-proportion anime gacha card of {WHO[face]}, "
        f"wearing {CLOTH[skin]}. Adult head-to-body ratio, full body standing, not chibi, not super-deformed. "
        "Match the second image's finish: ornate gold circular frame, night shrine, moon, cherry blossoms, wet stone. "
        "Keep her face, hair color, eye color and weapon count from the first image. "
        "No text, no watermark, no second person, no extra weapon."
    )
    log(f"{card_id} GPT edits")
    card = to_card(edits([ref, style], full_mask(ref), prompt))
    dest.parent.mkdir(parents=True, exist_ok=True)
    card.save(dest, "WEBP", quality=90, method=6)
    log(f"ok {card_id} {dest.stat().st_size // 1024}KB")


def main() -> None:
    want = sys.argv[1:]
    jobs = [job for job in JOBS if not want or job[0] in want]
    log(f"shop cards {len(jobs)}")
    for card_id, face, skin in jobs:
        try:
            one(card_id, face, skin)
        except Exception as exc:
            log(f"fail {card_id}: {exc}")


if __name__ == "__main__":
    main()
