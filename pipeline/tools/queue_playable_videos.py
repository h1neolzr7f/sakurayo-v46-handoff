"""按能播的位置，一次只出一条 Grok 视频。

每条只生成一次。首尾差太大就不装进游戏，也不再抽同一条。
已经写过 done 标记的任务会跳过。
"""

import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops

from batch_sprite_poses import key_orange, on_orange, pin_feet, save_webp

ART = Path(r"E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art")
LIVE = ART / "live_video"
GROK = Path(r"E:\deepseek工作区\game-lab\tools\vendor\imagine-batch-runner")
OUTDIR = GROK / "downloads" / "mascot"
ROOT = Path(r"E:\deepseek工作区\game-lab\assets\keyframes\playable")
WORK = ROOT / "work"
DONE = ROOT / "done"
BAK = ROOT / "bak"
LOG = ROOT / "log.txt"
PACK = Path(r"E:\deepseek工作区\game-lab\tools\pack_mascot_video.py")
CAP = 8 * 1024 * 1024

LOCK = (
    "Fixed camera. No zoom, no new people, no text, no logo, no watermark. "
    "Then the picture returns exactly to the first frame."
)


def log(msg: str) -> None:
    print(msg, flush=True)
    ROOT.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")


def png_of(src: Path, name: str) -> Path:
    dest = ROOT / f"{name}.png"
    im = Image.open(src).convert("RGB")
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG")
    return dest


def orange_png(cid: str) -> Path:
    idle = ART / "characters" / cid / "default" / "anim_idle.webp"
    dest = ROOT / f"skill-{cid}-idle.png"
    on_orange(Image.open(idle)).save(dest, "PNG")
    return dest


def mean_diff(a: Image.Image, b: Image.Image) -> float:
    ia = a.convert("RGB")
    ib = b.convert("RGB")
    if ia.size != ib.size:
        ib = ib.resize(ia.size)
    g = ImageChops.difference(ia, ib).convert("L")
    hist = g.histogram()
    total = sum(i * n for i, n in enumerate(hist))
    return total / (ia.width * ia.height)


def grab(src: Path, dest: Path, mode: str) -> bool:
    if mode == "first":
        args = ["ffmpeg", "-y", "-v", "error", "-i", str(src), "-frames:v", "1", str(dest)]
    elif mode == "last":
        args = ["ffmpeg", "-y", "-v", "error", "-sseof", "-0.15", "-i", str(src), "-frames:v", "1", str(dest)]
    else:
        args = ["ffmpeg", "-y", "-v", "error", "-ss", mode, "-i", str(src), "-frames:v", "1", str(dest)]
    r = subprocess.run(args, capture_output=True)
    return r.returncode == 0 and dest.exists() and dest.stat().st_size > 1000


def ends(src: Path) -> tuple[float, float]:
    WORK.mkdir(parents=True, exist_ok=True)
    first = WORK / "judge_first.png"
    last = WORK / "judge_last.png"
    mid = WORK / "judge_mid.png"
    grab(src, first, "first")
    grab(src, last, "last")
    grab(src, mid, "2.4")
    d0 = mean_diff(Image.open(first), Image.open(last))
    d1 = mean_diff(Image.open(first), Image.open(mid)) if mid.exists() else 0.0
    return d0, d1


def grok(frames: list[Path], name: str, prompt: str) -> Path | None:
    out = OUTDIR / f"{name}.mp4"
    if out.exists() and out.stat().st_size > 20000:
        log(f"已有原片，不再生成 {name}")
        return out
    log(f"Grok 开始 {name}")
    try:
        r = subprocess.run(
            ["node", "make-keyed-video.js", *[str(p) for p in frames], name, prompt],
            cwd=GROK,
            timeout=16 * 60,
        )
    except subprocess.TimeoutExpired:
        log(f"Grok 超时 {name}")
        subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | "
             "Where-Object { $_.CommandLine -like '*main-chrome*' } | "
             "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"],
            check=False,
        )
        r = subprocess.CompletedProcess(args=[], returncode=124)
    if out.exists() and out.stat().st_size > 20000:
        log(f"Grok 完成 {name} {(out.stat().st_size / 1024 / 1024):.2f}MB exit={r.returncode}")
        return out
    log(f"Grok 没有产出 {name} exit={r.returncode}")
    return None


def pack_flat(src: Path, mp4: Path, webm: Path, width: int) -> None:
    mp4.parent.mkdir(parents=True, exist_ok=True)
    vf = f"scale={width}:-2:flags=lanczos,fps=24"
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(src), "-an", "-vf", vf,
         "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", str(mp4)],
        check=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(mp4), "-an",
         "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0", "-row-mt", "1", str(webm)],
        check=True,
    )
    log(f"装入 {mp4.name} {mp4.stat().st_size // 1024}KB + {webm.name} {webm.stat().st_size // 1024}KB")


def width_for(src: Path) -> int:
    im = Image.open(src)
    return 1280 if im.width >= im.height else 720


def dir_size(path: Path) -> int:
    return sum(f.stat().st_size for f in path.rglob("*") if f.is_file())


def snapshot(cid: str) -> None:
    src = LIVE / cid
    dest = BAK / cid
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)


def restore(cid: str) -> None:
    src = BAK / cid
    dest = LIVE / cid
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)


def pack_lobby(src: Path, cid: str, kind: str, name: str) -> bool:
    snapshot(cid)
    cmd = [sys.executable, str(PACK), str(src), cid, "--kind", kind]
    if name:
        cmd += ["--name", name]
    r = subprocess.run(cmd, cwd=PACK.parent)
    total = dir_size(LIVE / cid)
    log(f"大厅 {cid} {name or kind} 目录 {total / 1024 / 1024:.2f}MB pack={r.returncode}")
    if total > CAP:
        restore(cid)
        log(f"超过 8MB，已撤回 {cid}")
        return False
    return r.returncode == 0


def orange_bg(im: Image.Image) -> float:
    rgb = np.asarray(im.convert("RGB"), dtype=np.int16)
    h, w = rgb.shape[:2]
    bits = np.concatenate([
        rgb[:16, :16].reshape(-1, 3),
        rgb[:16, w - 16:].reshape(-1, 3),
        rgb[h - 16:, :16].reshape(-1, 3),
        rgb[h - 16:, w - 16:].reshape(-1, 3),
    ])
    return float(np.abs(bits.mean(axis=0) - np.array([255, 122, 0])).sum())


def extract_skill(video: Path, cid: str) -> bool:
    idle = Image.open(ART / "characters" / cid / "default" / "anim_idle.webp").convert("RGBA")
    times = ["0.4", "1.0", "1.6", "2.2", "2.8", "3.4", "4.2", "5.0"]
    frames = []
    for i, t in enumerate(times):
        dest = WORK / f"{cid}_skill_{i}.png"
        if grab(video, dest, t):
            frames.append(dest)
    if len(frames) < 3:
        log(f"技能抽帧失败 {cid}")
        return False
    base = Image.open(frames[0]).convert("RGB")
    if orange_bg(base) > 140:
        log(f"技能底不是橙色，不覆盖现有帧 {cid}")
        return False
    scored = []
    for p in frames:
        im = Image.open(p).convert("RGB")
        scored.append((mean_diff(base, im), p, im))
    peak = max(range(len(scored)), key=lambda i: scored[i][0])
    follow = peak + 1 if peak + 1 < len(scored) else max(0, peak - 1)
    if peak == follow:
        follow = min(len(scored) - 1, 2)
    log(f"技能峰值 {cid} t-index {peak} diff {scored[peak][0]:.2f} / 收招 {follow}")

    def sprite(im: Image.Image, dest: Path) -> bool:
        keyed = key_orange(im.resize(idle.size, Image.Resampling.LANCZOS))
        alpha = np.asarray(keyed.split()[-1])
        ratio = float((alpha > 24).mean())
        if ratio < 0.08 or ratio > 0.85:
            log(f"抠图比例异常 {dest.name} {ratio:.2f}")
            return False
        try:
            pinned = pin_feet(keyed, idle)
        except Exception as err:
            log(f"脚底对齐失败 {dest.name} {err}")
            return False
        save_webp(pinned, dest)
        return True

    tmp_a = WORK / f"{cid}_skill.webp"
    tmp_b = WORK / f"{cid}_skill_b.webp"
    if not sprite(scored[peak][2], tmp_a) or not sprite(scored[follow][2], tmp_b):
        return False
    skill = ART / "characters" / cid / "default" / "anim_skill.webp"
    skill_b = ART / "characters" / cid / "default" / "anim_skill_b.webp"
    shutil.copy2(tmp_a, skill)
    shutil.copy2(tmp_b, skill_b)
    log(f"写入 {skill.relative_to(ART)} {skill.stat().st_size // 1024}KB / {skill_b.name} {skill_b.stat().st_size // 1024}KB")
    return True


def mark(name: str, text: str) -> None:
    DONE.mkdir(parents=True, exist_ok=True)
    (DONE / f"{name}.txt").write_text(text, encoding="utf-8")
    log(f"标记 {name}: {text}")


def install_pair(src: Path, mp4: Path, webm: Path, gate: float, still: Path) -> str:
    d0, d1 = ends(src)
    log(f"判定 {src.name} 首尾 {d0:.2f} 中段 {d1:.2f} 门槛 {gate}")
    if d0 > gate:
        return f"reject ends {d0:.2f}"
    pack_flat(src, mp4, webm, width_for(still))
    return f"installed ends {d0:.2f} mid {d1:.2f}"


def jobs() -> list[dict]:
    frames = {
        "sayo": Path(r"E:\deepseek工作区\game-lab\assets\mascot-frames\sayo_frame.png"),
        "aya": Path(r"E:\deepseek工作区\game-lab\assets\mascot-frames\aya_frame.png"),
        "rion": Path(r"E:\deepseek工作区\game-lab\assets\mascot-frames\rion_frame.png"),
    }
    cgs = [
        ("cg-rewind", ART / "story/ch1/cg_rewind.webp",
         "The fireworks, lantern light, and petals drift a little, as if the night rewinds one breath. The same people stay still. " + LOCK),
        ("cg-ema", ART / "story/ch1/cg_ema.webp",
         "Prayer plaques sway slightly and the lantern flames flicker. The same people stay still. " + LOCK),
        ("cg-kawaraban", ART / "story/ch2/cg_kawaraban.webp",
         "The printed broadsheets flutter in the air. The same people stay still. " + LOCK),
        ("cg-ashes", ART / "story/ch2/cg_ashes.webp",
         "Unburned ash and small embers drift. The same people stay still. " + LOCK),
        ("cg-reveal", ART / "story/ch3/cg_reveal.webp",
         "The giant mask and the crying woman stay the same. Only hair, cloth, and the mask edge shift slightly. " + LOCK),
        ("cg-dawn", ART / "story/ch4/cg_dawn.webp",
         "Fireworks and petals drift. The same four people stay. " + LOCK),
    ]
    out = []
    for name, still, prompt in cgs:
        out.append({"name": name, "kind": "flat", "still": still, "prompt": prompt,
                    "mp4": still.with_suffix(".mp4"), "webm": still.with_suffix(".webm"), "gate": 18})
    out.append({
        "name": "aya-collar", "kind": "lobby", "still": frames["aya"], "cid": "aya",
        "zone": "tap_head", "clip": "tap_head2", "gate": 24,
        "prompt": (
            "She closes her eyes and tidies the collar with one closed glove. "
            "The other hand keeps the pistol. One sheathed katana stays at her hip. The blue ribbon stays. "
            "No second sword, no open fingers, no waving. " + LOCK
        ),
    })
    out.append({
        "name": "rion-tsuba", "kind": "lobby", "still": frames["rion"], "cid": "rion",
        "zone": "tap_head", "clip": "tap_head2", "gate": 24,
        "prompt": (
            "Her closed knuckles rest on the sword guard. The blade stays fully sheathed. "
            "Both hands stay near the one sword. No unsheathing, no peace sign. " + LOCK
        ),
    })
    out.append({
        "name": "sayo-ready", "kind": "lobby", "still": frames["sayo"], "cid": "sayo",
        "zone": "tap_body", "clip": "", "gate": 24,
        "prompt": (
            "She brings the one rifle up into a ready carry. The coat hem and sleeves move with that shift. "
            "Both gloved hands stay with the one rifle. No second rifle, no waving. " + LOCK
        ),
    })
    skills = {
        "sayo": "Chibi. Flat orange background stays #ff7a00. She fires the one rifle and a bright muzzle burst flares, then she returns. Same face, same hair, same outfit, one rifle only. No text.",
        "aya": "Chibi. Flat orange background stays #ff7a00. She fires the pistol and cuts once with the one katana, then she returns. One pistol and one katana only. No second sword. No text.",
        "rion": "Chibi. Flat orange background stays #ff7a00. She draws the one katana and the blade flashes, then she returns. One sword only. No text.",
    }
    for cid, prompt in skills.items():
        out.append({"name": f"skill-{cid}", "kind": "skill", "cid": cid, "prompt": prompt})
    for n in range(1, 5):
        still = ART / f"bosses/stage{n}_phase2.webp"
        out.append({
            "name": f"boss-s{n}", "kind": "flat", "still": still, "gate": 30,
            "mp4": ART / f"pv/boss/stage{n}_phase2.mp4",
            "webm": ART / f"pv/boss/stage{n}_phase2.webm",
            "prompt": (
                "The same boss shifts into a more aggressive second phase. Effects flare, then the pose eases back. "
                "No new characters. " + LOCK
            ),
        })
    for cid in ("sayo", "aya", "rion"):
        out.append({
            "name": f"gacha-{cid}", "kind": "flat", "still": frames[cid], "gate": 30,
            "mp4": ART / f"pv/gacha/{cid}.mp4",
            "webm": ART / f"pv/gacha/{cid}.webm",
            "prompt": (
                "A vertical full-body obtain performance. She steps forward once, the weapon flashes, "
                "and light or petals burst around the same person. Same weapon count. " + LOCK
            ),
        })
    for cid in ("sayo", "aya", "rion"):
        out.append({
            "name": f"ascend-{cid}", "kind": "flat", "still": frames[cid], "gate": 30,
            "mp4": ART / f"pv/ascend/{cid}.mp4",
            "webm": ART / f"pv/ascend/{cid}.webm",
            "prompt": (
                "A vertical full-body third-stage transformation. Light wraps the same outfit for a moment, "
                "then she eases back. Same face and the same weapon count. " + LOCK
            ),
        })
    out.extend(stock_jobs())
    return out


def stock_jobs() -> list[dict]:
    """同名视频：能播的画面优先，职业/融合立绘只入库，缺文件就跳过。"""
    ambient = (
        "Subtle motion already in the picture: light, smoke, water, cloth, petals, or embers. "
        "No new people, no text, no zoom. " + LOCK
    )
    boss = (
        "The same boss pushes into a harsher phase. Effects flare, then the pose eases back. "
        "No new characters. " + LOCK
    )
    splash = (
        "The same illustration breathes: hair, cloth, and light shift slightly, then it returns. "
        "No new people, no text, no zoom. " + LOCK
    )
    queued: list[dict] = []

    def add(name: str, still: Path, prompt: str, gate: float, mp4: Path | None = None, webm: Path | None = None) -> None:
        if not still.exists() or (DONE / f"{name}.txt").exists():
            return
        mp4 = mp4 or still.with_suffix(".mp4")
        webm = webm or still.with_suffix(".webm")
        if mp4.exists() and mp4.stat().st_size > 20000:
            return
        queued.append({
            "name": name, "kind": "flat", "still": still, "prompt": prompt, "gate": gate,
            "mp4": mp4, "webm": webm,
        })

    story_first = [
        "story/ch1/bg_v3_pre.webp", "story/ch1/bg_v3_end.webp",
        "story/ch2/bg_street.webp", "story/ch2/bg_shateki.webp",
        "story/ch3/bg_river.webp", "story/ch4/bg_honden.webp",
        "story/ch1/map.webp",
    ]
    for rel in story_first:
        still = ART / rel
        add("amb-" + rel[:-5].replace("/", "-"), still, ambient, 22)
    for n in range(1, 5):
        for kind in ("chapter_keyart_v2", "cg"):
            still = ART / f"stages/stage_{n}/{kind}.webp"
            add(f"amb-stage{n}-{kind}", still, ambient, 22)
    for rel in (
        "ui/result_win_v5.webp", "ui/result_lose_v5.webp", "ui/loading_v5.webp",
        "ui/tactical/lobby-night-v5.webp", "ui/cover_v36_main_god.webp",
    ):
        add("amb-" + rel[:-5].replace("/", "-"), ART / rel, ambient, 22)
    for n in range(1, 5):
        for phase in (3, 4):
            add(
                f"boss-s{n}-p{phase}",
                ART / f"bosses/stage{n}_phase{phase}.webp",
                boss,
                30,
                ART / f"pv/boss/stage{n}_phase{phase}.mp4",
                ART / f"pv/boss/stage{n}_phase{phase}.webm",
            )
    for n in range(1, 5):
        for kind in ("ground_v3", "battle_bg_v2"):
            still = ART / f"stages/stage_{n}/{kind}.webp"
            add(f"lib-stage{n}-{kind}", still, ambient, 22)
    seen = {job["still"].resolve() for job in queued}
    if (ART / "story").exists():
        for still in sorted((ART / "story").rglob("*.webp")):
            if still.resolve() in seen:
                continue
            rel = still.relative_to(ART).with_suffix("").as_posix().replace("/", "-")
            add(f"lib-{rel}", still, ambient, 22)
    for folder in ("ascensions", "careers", "fusions"):
        root = ART / folder
        if not root.exists():
            continue
        for still in sorted(root.rglob("splash.webp")):
            rel = still.relative_to(ART).with_suffix("").as_posix().replace("/", "-")
            add(f"lib-{rel}", still, splash, 24)
    return queued


def one(job: dict) -> None:
    name = job["name"]
    marker = DONE / f"{name}.txt"
    if marker.exists():
        log(f"跳过已处理 {name}: {marker.read_text(encoding='utf-8').strip()}")
        return
    kind = job["kind"]
    if kind == "skill":
        still = orange_png(job["cid"])
    else:
        still = png_of(job["still"], name) if job["still"].suffix.lower() != ".png" else job["still"]
        if job["still"].suffix.lower() == ".png" and not still.exists():
            log(f"静帧不存在 {still}")
            mark(name, "missing still")
            return
    video = grok([still, still, still], name, job["prompt"])
    if video is None:
        mark(name, "no video")
        return
    if kind == "flat":
        mark(name, install_pair(video, job["mp4"], job["webm"], job["gate"], still))
    elif kind == "lobby":
        d0, d1 = ends(video)
        log(f"判定 {name} 首尾 {d0:.2f} 中段 {d1:.2f}")
        if d0 > job["gate"]:
            mark(name, f"reject ends {d0:.2f}")
            return
        ok = pack_lobby(video, job["cid"], job["zone"], job["clip"])
        mark(name, f"{'packed' if ok else 'pack-rejected'} ends {d0:.2f} mid {d1:.2f}")
    elif kind == "skill":
        ok = extract_skill(video, job["cid"])
        mark(name, "extracted" if ok else "extract-rejected")


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    log("---- 队列开始 ----")
    for job in jobs():
        try:
            one(job)
        except Exception as err:
            log(f"任务失败 {job['name']}: {err}")
            mark(job["name"], f"error {err}")
    log("---- 队列结束 ----")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
