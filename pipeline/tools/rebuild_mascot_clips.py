"""从磁盘上的视频文件重建三个角色的 _clips.json 与 clips.js。

用途：clips.js 之前被正则拼接写坏了（any 数组括号错乱），
这里按"以文件为准"的方式重新生成，保证语法正确。

分类规则：
  idle.*      -> idle
  tap_head.*  -> taps.head
  tap_body.*  -> taps.body
  act<N>.*    -> taps.any（按 N 排序）
  tap_<N>.*   -> taps.any（兼容旧命名）
"""

import json
import re
from pathlib import Path

LIVE_VIDEO = Path(
    r"E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art\live_video"
)
CHARS = ["sayo", "aya", "rion"]


def js(v):
    return json.dumps(v, ensure_ascii=False)


def rebuild(cid: str) -> dict:
    d = LIVE_VIDEO / cid
    if not d.is_dir():
        return {}

    def pair_for(base: str):
        """返回 [webm, mp4] 或 None（两个格式都存在才算完整）。"""
        webm = d / f"{base}.webm"
        mp4 = d / f"{base}.mp4"
        if webm.exists() and mp4.exists():
            return [f"{base}.webm", f"{base}.mp4"]
        if mp4.exists():
            return [f"{base}.mp4"]
        if webm.exists():
            return [f"{base}.webm"]
        return None

    st = {"idle": [], "taps": {}, "poster": "poster.webp"}

    idle = pair_for("idle")
    if idle:
        st["idle"] = idle

    for key, base in (("head", "tap_head"), ("body", "tap_body")):
        p = pair_for(base)
        if p:
            st["taps"][key] = [p]

    # 动作库：actN 优先，其次旧的 tap_N
    acts = []
    for f in d.iterdir():
        m = re.fullmatch(r"act(\d+)\.(mp4|webm)", f.name)
        if m:
            acts.append((int(m.group(1)), f"act{m.group(1)}"))
        else:
            m2 = re.fullmatch(r"tap_(\d+)\.(mp4|webm)", f.name)
            if m2:
                acts.append((int(m2.group(1)), f"tap_{m2.group(1)}"))
    acts = sorted({b for _, b in acts}, key=lambda x: (len(x), x))
    pool = []
    for base in acts:
        p = pair_for(base)
        if p:
            pool.append(p)
    if pool:
        st["taps"]["any"] = pool

    if not (d / "poster.webp").exists():
        st.pop("poster", None)

    # 写 JSON 状态
    (d / "_clips.json").write_text(json.dumps(st, ensure_ascii=False, indent=2), encoding="utf-8")

    # 生成 clips.js
    taps_lines = []
    for key in ("head", "body", "any"):
        if st["taps"].get(key):
            taps_lines.append(f"    {key}: {js(st['taps'][key])}")
    taps_obj = "{\n" + ",\n".join(taps_lines) + "\n  }" if taps_lines else "{}"

    poster_line = f'  poster: "{st["poster"]}"\n' if st.get("poster") else ""
    body = (
        "// 由 pack_mascot_video.py 生成 —— 视频看板娘清单。请勿手改，改动会被下次生成覆盖。\n"
        "// 规格见 docs/MASCOT_VIDEO.md：idle 无缝循环；taps 播完自动回 idle。\n"
        "// any 是不分部位的动作库，运行时在其内部随机轮换（head/body 与 any 合并后一起抽）。\n"
        f'(window.SakurayoMascotVideoClips = window.SakurayoMascotVideoClips || {{}})["{cid}"] = {{\n'
        f"  idle: {js(st['idle'])},\n"
        f"  taps: {taps_obj},\n"
        f"{poster_line}"
        "};\n"
    )
    (d / "clips.js").write_text(body, encoding="utf-8")
    return st


print("=== 重建 clips ===")
for cid in CHARS:
    st = rebuild(cid)
    if not st:
        print(f"  {cid}: 目录不存在")
        continue
    n_any = len(st["taps"].get("any", []))
    print(f"  {cid:5} idle={'有' if st['idle'] else '无'} "
          f"head={'有' if st['taps'].get('head') else '无'} "
          f"body={'有' if st['taps'].get('body') else '无'} "
          f"动作库={n_any} 个")

# 顺带登记 index.js
index = LIVE_VIDEO / "index.js"
have = [c for c in CHARS if (LIVE_VIDEO / c / "clips.js").exists()]
index.write_text(
    "// 登记有视频看板娘的角色 id（对应 live_video/<id>/clips.js）。新增角色视频时把 id 加进来。\n"
    "window.SakurayoMascotVideoIndex = [" + ", ".join(f'"{c}"' for c in have) + "];\n",
    encoding="utf-8",
)
print(f"\nindex.js -> {have}")
