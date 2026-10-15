"""颜色令牌检查：UI 层（src/runtime/sakurayo-ui-*.js）禁止写死颜色值，必须用 var(--c-*) 或 SakurayoTok()。
旧代码（src/index.html 和其它 runtime 文件）里的硬编码颜色先登记基线，只许减少不许增加（ratchet）。
用法：python3 tools/check_colors.py [--update-baseline]"""
import json, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAT = re.compile(r'(?<![\w&-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b(?![\w-])|\b(?:rgba?|hsla?|oklch)\(\s*[\d.]')
STRICT = sorted((ROOT / "src/runtime").glob("sakurayo-ui-*.js"))
BASE = ROOT / "tools/color_baseline.json"

def strip_tokens(s):  # 令牌定义区本身允许出现颜色
    return re.sub(r"/\* tokens:start \*/.*?/\* tokens:end \*/", "", s, flags=re.S)

def scan(p, strict):
    s = p.read_text(encoding="utf-8")
    if strict: s = strip_tokens(s)
    hits = []
    for i, line in enumerate(s.splitlines(), 1):
        for m in PAT.finditer(line):
            if line[max(0, m.start() - 6):m.start()].endswith("&#") or "data:image" in line[:m.start()][-200:]: continue
            hits.append((i, m.group(0)))
    return hits

def main():
    bad = 0
    for p in STRICT:
        if p.name == "sakurayo-ui-tokens.js": continue
        for i, v in scan(p, True): print("ERROR %s:%d 硬编码颜色 %s（请改用 var(--c-*) 令牌）" % (p.relative_to(ROOT), i, v)); bad += 1
    legacy = {str(p.relative_to(ROOT)): len(scan(p, False)) for p in [ROOT / "src/index.html", *sorted((ROOT / "src/runtime").glob("*.js"))] if p not in STRICT}
    if "--update-baseline" in sys.argv: BASE.write_text(json.dumps(legacy, indent=1, ensure_ascii=False)); print("baseline updated"); return 0
    base = json.loads(BASE.read_text()) if BASE.exists() else {}
    for f, n in legacy.items():
        if n > base.get(f, 0): print("ERROR %s 硬编码颜色从 %d 增加到 %d（旧代码只许减少；新颜色请走令牌）" % (f, base.get(f, 0), n)); bad += 1
    total = sum(legacy.values())
    print("color check: UI 层 %d 个文件全部走令牌%s；旧代码硬编码颜色 %d 处（基线 %d）" % (len(STRICT), "" if not bad else "【失败】", total, sum(base.values())))
    return 1 if bad else 0
sys.exit(main())
