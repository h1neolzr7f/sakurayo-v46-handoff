"""按 _clips.json 重写 clips.js，不转码。"""
import json
from pathlib import Path

root = Path(r"E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art\live_video")


def js(value) -> str:
    return json.dumps(value, ensure_ascii=False)


def main() -> None:
    for cid in ("sayo", "aya", "rion"):
        st = json.loads((root / cid / "_clips.json").read_text(encoding="utf-8"))
        taps_lines = []
        for key in ("head", "body", "any"):
            if st["taps"].get(key):
                taps_lines.append(f"    {key}: {js(st['taps'][key])}")
        taps_obj = "{\n" + ",\n".join(taps_lines) + "\n  }"
        greet = f"  greet: {js(st['greet'])},\n" if st.get("greet") else ""
        body = (
            "// 由 pack_mascot_video.py 生成 —— 视频看板娘清单。请勿手改，改动会被下次生成覆盖。\n"
            "// 规格见 docs/MASCOT_VIDEO.md：idle 无缝循环；taps 播完自动回 idle。\n"
            "// head / body 各自轮换。any 只在该部位没有专属片段时才用。\n"
            "// greet 是进大厅时播一次的招呼，播完回到 idle。只给人设里会打招呼的角色。\n"
            f'(window.SakurayoMascotVideoClips = window.SakurayoMascotVideoClips || {{}})["{cid}"] = {{\n'
            f"  idle: {js(st['idle'])},\n"
            f"  taps: {taps_obj},\n"
            f"{greet}"
            f'  poster: "{st["poster"]}"\n'
            "};\n"
        )
        (root / cid / "clips.js").write_text(body, encoding="utf-8")
        print(cid, {k: len(v) for k, v in st["taps"].items()})


if __name__ == "__main__":
    main()
