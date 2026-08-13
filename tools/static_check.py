#!/usr/bin/env python3
"""对单文件 HTML 做可重复静态检查，不替代真实浏览器测试。"""
from __future__ import annotations

import argparse
import re
from pathlib import Path


SCRIPT_BLOCK = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>", flags=re.S | re.I)
SRC_ATTR = re.compile(r"\bsrc=[\"'](?P<src>[^\"']+)[\"']", flags=re.I)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", nargs="?", default="src/index.html")
    parser.add_argument("--out", default="tests/artifacts/static/index.extracted.js")
    parser.add_argument("--require-bundled", action="store_true")
    args = parser.parse_args()

    path = Path(args.path)
    text = path.read_text(encoding="utf-8")
    scripts: list[str] = []
    external_scripts: list[str] = []
    for match in SCRIPT_BLOCK.finditer(text):
        src_match = SRC_ATTR.search(match.group("attrs"))
        if not src_match:
            scripts.append(match.group("body"))
            continue
        src = src_match.group("src")
        if re.match(r"^(?:https?:)?//", src, flags=re.I):
            print("FAIL: external runtime script detected:", src)
            return 1
        resolved = (path.parent / src).resolve()
        try:
            resolved.relative_to(path.parent.resolve())
        except ValueError:
            print("FAIL: script escapes source directory:", src)
            return 1
        if not resolved.is_file():
            print("FAIL: local script missing:", src)
            return 1
        external_scripts.append(src)
        scripts.append(resolved.read_text(encoding="utf-8"))

    if args.require_bundled and external_scripts:
        print("FAIL: bundled entry still contains external scripts:", ", ".join(external_scripts))
        return 1
    combined = "\n".join(scripts)
    required = [
        "function startGame(",
        "function update(",
        "function spawnEnemy(",
        "function draw(",
        "function showDialogue(",
        "const CHARACTERS35",
        "const SKINS35",
        'sakurayoV3',
        "window.render_game_to_text",
        'addEventListener("error"',
        'addEventListener("unhandledrejection"',
        "window.SakurayoContent",
        "migrateSave(save)",
        "MOD KIT LIFECYCLE SEAM",
        'runHooks("combat:after-draw"',
        "CONTENT PACK ADAPTER",
    ]
    missing = [item for item in required if item not in combined]
    if missing:
        print("FAIL: missing required symbols:")
        for item in missing:
            print(" -", item)
        return 1

    if not scripts:
        print("FAIL: no inline script found")
        return 1
    if re.search(r"<(?:script|link|img)[^>]+(?:src|href)=[\"']https?://", text, flags=re.I):
        print("FAIL: external runtime resource detected")
        return 1

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(combined, encoding="utf-8")
    print(f"OK: {len(required)} required symbols present; {len(scripts)} scripts ({len(external_scripts)} local external) -> {out}")
    print(f"Next: node --check {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
