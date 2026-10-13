"""看板娘视频后处理：按 docs/MASCOT_VIDEO.md 规格转码并接入游戏。

流程：
 1. 量化首尾帧差异 —— 决定能否直接循环，还是需要"正放+倒放"拼接
 2. 转 720x1080 / 30fps / H.264 / 无音轨 / +faststart
 3. 转 WebM VP9 / 无音轨
 4. 生成 poster.webp（仅 idle 需要）
 5. 更新 live_video/<角色>/clips.js（idle / taps 分别登记）
 6. 把角色 id 登记进 live_video/index.js

用法:
  python pack_mascot_video.py <输入mp4> <角色id>                       # 待机循环
  python pack_mascot_video.py <输入mp4> <角色id> --kind tap_head       # 头部点击反应
  python pack_mascot_video.py <输入mp4> <角色id> --kind tap_body       # 身体点击反应
  python pack_mascot_video.py <输入mp4> <角色id> --kind tap_any --slot 1  # 通用点击（可多个）
  python pack_mascot_video.py <输入mp4> <角色id> --kind tap_head --name tap_head2
"""

import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops

GAME_ART = Path(
    r"E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art"
)
LIVE_VIDEO = GAME_ART / "live_video"
WORK = Path(r"E:\deepseek工作区\game-lab\assets\_mascot_work")
WORK.mkdir(parents=True, exist_ok=True)

TARGET_W, TARGET_H = 720, 1080  # 规格：2:3，推荐 720x1080
FPS = 30


def run(args, label):
    r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    ok = r.returncode == 0
    print(f"  {'OK  ' if ok else 'FAIL'} {label}")
    if not ok:
        print("    " + (r.stderr or "")[-400:].replace("\n", "\n    "))
    return ok


def probe(path: Path) -> dict:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
         "-show_entries", "format=duration,size", "-of", "json", str(path)],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    return json.loads(r.stdout or "{}")


def extract_frame(src: Path, out: Path, mode: str) -> bool:
    if mode == "first":
        args = ["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vframes", "1", str(out)]
    else:
        args = ["ffmpeg", "-y", "-v", "error", "-sseof", "-0.15", "-i", str(src), "-vframes", "1", str(out)]
    return run(args, f"抽{'首' if mode == 'first' else '尾'}帧")


def frame_diff(a: Path, b: Path) -> float:
    """返回 0-255 的平均像素差。"""
    ia = Image.open(a).convert("RGB")
    ib = Image.open(b).convert("RGB")
    if ia.size != ib.size:
        ib = ib.resize(ia.size)
    diff = ImageChops.difference(ia, ib)
    # 转灰度后取均值
    g = diff.convert("L")
    hist = g.histogram()
    total = sum(i * n for i, n in enumerate(hist))
    return total / (ia.width * ia.height)


def main() -> int:
    if len(sys.argv) < 3:
        print("用法: python pack_mascot_video.py <输入mp4> <角色id> [--kind tap_head|tap_body|tap_any] [--slot N] [--no-reverse]")
        return 1

    src = Path(sys.argv[1])
    cid = sys.argv[2]
    force_no_reverse = "--no-reverse" in sys.argv

    kind = "idle"
    if "--kind" in sys.argv:
        kind = sys.argv[sys.argv.index("--kind") + 1]
    slot = 1
    if "--slot" in sys.argv:
        slot = int(sys.argv[sys.argv.index("--slot") + 1])
    # 裁剪：默认不裁。Grok 出的 6 秒完整动作比碎片更有表现力，
    # 用户明确要求动作可以 7-8 秒，所以只在显式传参时才裁。
    trim_start = None
    if "--trim-start" in sys.argv:
        trim_start = float(sys.argv[sys.argv.index("--trim-start") + 1])
    trim_dur = None
    if "--trim-dur" in sys.argv:
        trim_dur = float(sys.argv[sys.argv.index("--trim-dur") + 1])

    # 输出基名：idle 段就叫 idle；点击段叫 tap_head / tap_body；
    # action 段编入动作库（act1, act2...），写进 taps.any 参与轮换。
    # --name 覆盖文件名，但 --kind 仍决定写进哪一个点击区。
    name_override = ""
    if "--name" in sys.argv:
        name_override = sys.argv[sys.argv.index("--name") + 1].strip()
    if name_override:
        base = name_override
    elif kind == "idle":
        base = "idle"
    elif kind == "tap_head":
        base = "tap_head"
    elif kind == "tap_body":
        base = "tap_body"
    elif kind.startswith("action"):
        base = f"act{slot}"
    else:
        base = f"tap_{slot}"

    if not src.exists():
        print(f"输入不存在: {src}")
        return 1

    print(f"=== 源视频: {src.name}  (类型: {kind}, 输出名: {base}) ===")
    p = probe(src)
    st = (p.get("streams") or [{}])[0]
    fmt = p.get("format") or {}
    print(f"  {st.get('width')}x{st.get('height')} {st.get('r_frame_rate')} "
          f"{st.get('nb_frames')}帧 {float(fmt.get('duration', 0)):.2f}s")

    # ---- 1. 首尾差异 ----
    print("\n=== 1. 首尾帧一致性检查 ===")
    first = WORK / f"{cid}_{base}_first.png"
    last = WORK / f"{cid}_{base}_last.png"
    extract_frame(src, first, "first")
    extract_frame(src, last, "last")
    d = frame_diff(first, last)
    print(f"  首尾平均像素差: {d:.2f} / 255")
    # 默认**不倒放**：生成提示词一律要求 "then smoothly returns to the exact original pose"，
    # 视频自己就闭环了，倒放会让体积翻倍而且有"倒带感"。
    # 运行时两段视频之间是 0.18s 交叉淡入，足够吸收首尾这点残差（实测 ~7/255 ≈ 2.7%）。
    # 只有显式传 --reverse 才走正放+倒放（用于确实回不去的素材）。
    need_reverse = "--reverse" in sys.argv
    if need_reverse:
        print(f"  结论: 显式要求倒放（首尾差 {d:.2f}）")
    else:
        print(f"  结论: 不倒放，靠视频自身闭环（残差 {d:.2f}/255 由 0.18s 交叉淡入吸收）")

    # ---- 1.5 裁剪（规格：点击片段 1.5-4 秒）----
    work_src = src
    if trim_start is not None or trim_dur is not None:
        trimmed = WORK / f"{cid}_{base}_trim.mp4"
        print("\n=== 1.5 裁剪精华段 ===")
        args = ["ffmpeg", "-y", "-v", "error"]
        if trim_start:
            args += ["-ss", str(trim_start)]
        args += ["-i", str(src)]
        if trim_dur:
            args += ["-t", str(trim_dur)]
        args += ["-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                 "-pix_fmt", "yuv420p", str(trimmed)]
        if run(args, f"裁 {trim_start or 0}s 起 {trim_dur or '全部'}s"):
            work_src = trimmed
            tp = probe(trimmed)
            tst = (tp.get("streams") or [{}])[0]
            print(f"  裁剪后 {tst.get('width')}x{tst.get('height')} "
                  f"{tst.get('nb_frames')}帧 {float((tp.get('format') or {}).get('duration', 0)):.2f}s")

    # ---- 2. 准备闭环源 ----
    loop_src = work_src
    if need_reverse:
        rev = WORK / f"{cid}_{base}_loop.mp4"
        # 倒放加速：正放保留完整表演，回来的时候快一点——既避免"慢动作倒带"的拖沓感，
        # 又直接砍掉体积。动作/点击片段用 2 倍速；idle 是循环，必须 1:1 才自然。
        rev_speed = 2.0 if kind.startswith(("action", "tap")) else 1.0
        print(f"\n=== 2. 生成无缝闭环（正放 + 倒放@{rev_speed}x）===")
        ok = run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(work_src),
             "-filter_complex",
             f"[0]split[a][b];[b]reverse,setpts=PTS/{rev_speed}[r];[a][r]concat=n=2:v=1[out]",
             "-map", "[out]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
             "-pix_fmt", "yuv420p", str(rev)],
            "正放 + 倒放",
        )
        if ok:
            loop_src = rev
            rp = probe(rev)
            rd = float((rp.get("format") or {}).get("duration", 0))
            print(f"  {rev.name} {(rev.stat().st_size / 1024 / 1024):.2f} MB / 闭环后 {rd:.2f}s")
    else:
        print("\n=== 2. 跳过倒放拼接 ===")

    # ---- 3. 输出目录 ----
    outdir = LIVE_VIDEO / cid
    outdir.mkdir(parents=True, exist_ok=True)
    print(f"\n=== 3. 输出到 {outdir} ===")

    w, h = int(st.get("width") or 0), int(st.get("height") or 0)
    vf = (
        f"scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=increase,"
        f"crop={TARGET_W}:{TARGET_H},fps={FPS}"
    )

    mp4 = outdir / f"{base}.mp4"
    # 动作片段（含正放+倒放）时长更长，用更高的 CRF 换体积；
    # idle 是反复循环播放的主力，保留更好的质量。
    crf_mp4 = "30" if kind.startswith(("action", "tap")) else "28"
    crf_webm = "46" if kind.startswith(("action", "tap")) else "42"
    run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(loop_src), "-vf", vf,
         "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
         "-crf", crf_mp4, "-preset", "slow", "-an", "-movflags", "+faststart", str(mp4)],
        f"{base}.mp4  {w}x{h} -> {TARGET_W}x{TARGET_H} (crf {crf_mp4})",
    )

    webm = outdir / f"{base}.webm"
    run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(loop_src), "-vf", vf,
         "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", crf_webm, "-row-mt", "1",
         "-deadline", "good", "-cpu-used", "2", "-an", str(webm)],
        f"{base}.webm (VP9, crf {crf_webm})",
    )

    # ---- 4. poster（仅 idle）----
    if kind == "idle":
        poster = outdir / "poster.webp"
        run(["ffmpeg", "-y", "-v", "error", "-i", str(mp4), "-vframes", "1",
             "-c:v", "libwebp", "-quality", "82", str(poster)], "poster.webp")

    # ---- 5. 更新 clips.js ----
    update_clips(outdir / "clips.js", cid, base, kind, slot)

    # ---- 6. 登记 index.js ----
    index = LIVE_VIDEO / "index.js"
    if index.exists():
        txt = index.read_text(encoding="utf-8")
        if f'"{cid}"' not in txt:
            m = re.search(r"window\.SakurayoMascotVideoIndex\s*=\s*\[([^\]]*)\]", txt)
            if m:
                ids = [x.strip() for x in m.group(1).split(",") if x.strip()]
                ids.append(f'"{cid}"')
                txt = txt[: m.start()] + "window.SakurayoMascotVideoIndex = [" + ", ".join(ids) + "]" + txt[m.end():]
                index.write_text(txt, encoding="utf-8")
                print(f"  index.js 已登记 {cid}")
        else:
            print(f"  index.js 已有 {cid}")

    # ---- 汇总 ----
    print(f"\n=== {cid}/{base} 产物 ===")
    total = 0
    for f in sorted(outdir.iterdir()):
        sz = f.stat().st_size
        total += sz
    for f in (mp4, webm):
        if f.exists():
            sz = f.stat().st_size
            flag = "  ⚠ 超过 1.5MB 规格" if sz > 1536 * 1024 else ""
            print(f"  {f.name:16} {sz / 1024:8.1f} KB{flag}")
    print(f"  角色目录合计 {total / 1024 / 1024:.2f} MB "
          f"({'✓ ≤8MB' if total <= 8 * 1024 * 1024 else '⚠ 超过 8MB'})")
    return 0


def update_clips(path: Path, cid: str, base: str, kind: str, slot: int) -> None:
    """把这一段登记进 clips.js。

    实现要点：绝不用正则去"就地增补" clips.js —— 里面的 any 数组是嵌套数组，
    非贪婪正则会把括号配对搞乱（实测生成了无法解析的 js）。
    改为维护一份 _clips.json 作为唯一事实来源，每次都完整重建 clips.js。
    """
    state_path = path.parent / "_clips.json"
    if state_path.exists():
        try:
            st = json.loads(state_path.read_text(encoding="utf-8"))
        except Exception:
            st = {}
    else:
        st = {}
    st.setdefault("idle", [])
    st.setdefault("taps", {})
    st.setdefault("poster", "poster.webp")

    pair = [f"{base}.webm", f"{base}.mp4"]

    if kind == "idle":
        st["idle"] = pair
    elif kind == "tap_head" or kind == "tap_body":
        zone = "head" if kind == "tap_head" else "body"
        pool = [x for x in st["taps"].get(zone, []) if x != pair]
        pool.insert(0, pair)
        st["taps"][zone] = pool
    elif kind.startswith("action") or kind == "tap_any":
        pool = st["taps"].get("any", [])
        # 同一个文件只登记一次（重复跑同一 slot 时覆盖而不是累加）
        pool = [x for x in pool if x != pair]
        pool.append(pair)
        st["taps"]["any"] = pool

    state_path.write_text(json.dumps(st, ensure_ascii=False, indent=2), encoding="utf-8")

    # 生成 clips.js —— 用 JSON 序列化保证语法绝对正确
    def js(v):
        return json.dumps(v, ensure_ascii=False)

    taps_lines = []
    for key in ("head", "body", "any"):
        if st["taps"].get(key):
            taps_lines.append(f"    {key}: {js(st['taps'][key])}")
    taps_obj = "{\n" + ",\n".join(taps_lines) + "\n  }" if taps_lines else "{}"
    greet_line = f"  greet: {js(st['greet'])},\n" if st.get("greet") else ""

    body = (
        "// 由 pack_mascot_video.py 生成 —— 视频看板娘清单。请勿手改，改动会被下次生成覆盖。\n"
        "// 规格见 docs/MASCOT_VIDEO.md：idle 无缝循环；taps 播完自动回 idle。\n"
        "// head / body 各自轮换。any 只在该部位没有专属片段时才用。\n"
        "// greet 是进大厅时播一次的招呼，播完回到 idle。只给人设里会打招呼的角色。\n"
        f'(window.SakurayoMascotVideoClips = window.SakurayoMascotVideoClips || {{}})["{cid}"] = {{\n'
        f"  idle: {js(st['idle'])},\n"
        f"  taps: {taps_obj},\n"
        f"{greet_line}"
        f'  poster: "{st["poster"]}"\n'
        "};\n"
    )
    path.write_text(body, encoding="utf-8")
    print(f"  clips.js 已重建（taps: {list(st['taps'].keys())}）")


if __name__ == "__main__":
    sys.exit(main())
