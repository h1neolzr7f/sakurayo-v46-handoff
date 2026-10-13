#!/usr/bin/env python3
"""asset_index — 给素材库建可检索索引。勤俭持家的第一步：先查有没有现成的。

用法：
    python asset_index.py scan  <素材根目录> [-o 索引.json]
    python asset_index.py find  <关键词> [--kind image|audio|font] [--min-w 256]
    python asset_index.py stats
    python asset_index.py dirs

索引默认落在 game-lab/knowledge/素材索引.json。
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image

IMAGE_EXT = {".webp", ".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tga"}
AUDIO_EXT = {".ogg", ".mp3", ".wav", ".m4a", ".opus", ".aac"}
FONT_EXT = {".woff2", ".woff", ".ttf", ".otf"}

DEFAULT_ROOT = r"E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art"
DEFAULT_INDEX = r"E:\deepseek工作区\game-lab\knowledge\素材索引.json"


def kind_of(ext: str) -> str:
    if ext in IMAGE_EXT:
        return "image"
    if ext in AUDIO_EXT:
        return "audio"
    if ext in FONT_EXT:
        return "font"
    return "other"


def scan(root: Path) -> list[dict]:
    items: list[dict] = []
    files = sorted(p for p in root.rglob("*") if p.is_file())
    for i, p in enumerate(files, 1):
        ext = p.suffix.lower()
        kind = kind_of(ext)
        rec = {
            "path": str(p),
            "rel": str(p.relative_to(root)).replace("\\", "/"),
            "name": p.stem,
            "ext": ext,
            "kind": kind,
            "bytes": p.stat().st_size,
            "category": p.relative_to(root).parts[0] if p.relative_to(root).parts else "",
        }
        if kind == "image":
            try:
                with Image.open(p) as im:
                    rec["w"], rec["h"] = im.size
                    rec["mode"] = im.mode
                    rec["alpha"] = "A" in im.mode
            except Exception as e:  # noqa: BLE001
                rec["error"] = str(e)
        items.append(rec)
        if i % 400 == 0:
            print(f"  ... {i}/{len(files)}", file=sys.stderr)
    return items


def cmd_scan(args) -> int:
    root = Path(args.root)
    if not root.is_dir():
        sys.exit(f"不是目录：{root}")
    print(f"扫描 {root} ...")
    items = scan(root)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"root": str(root), "count": len(items), "items": items}, ensure_ascii=False), encoding="utf-8")
    print(f"索引 {len(items)} 条 -> {out}  ({out.stat().st_size/1024:.0f} KB)")
    by_cat: dict[str, int] = defaultdict(int)
    for it in items:
        by_cat[it["category"]] += 1
    print("分类：")
    for k, v in sorted(by_cat.items(), key=lambda kv: -kv[1]):
        print(f"  {k:20} {v}")
    return 0


def load_index(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        sys.exit(f"索引不存在，先跑 scan：{p}")
    return json.loads(p.read_text(encoding="utf-8"))


def cmd_find(args) -> int:
    idx = load_index(args.index)
    pat = re.compile(args.keyword, re.I)
    hits = []
    for it in idx["items"]:
        if args.kind and it["kind"] != args.kind:
            continue
        if args.category and it["category"] != args.category:
            continue
        if args.min_w and (it.get("w") or 0) < args.min_w:
            continue
        if pat.search(it["rel"]):
            hits.append(it)
    print(f"命中 {len(hits)} 条（关键词 {args.keyword!r}）")
    for it in hits[: args.limit]:
        dim = f'{it.get("w")}x{it.get("h")}' if it.get("w") else ""
        alpha = "α" if it.get("alpha") else " "
        print(f'  [{it["category"]:14}] {it["rel"]:60} {dim:>11} {alpha} {it["bytes"]/1024:7.1f} KB')
    if len(hits) > args.limit:
        print(f"  ...还有 {len(hits)-args.limit} 条（用 --limit 加）")
    return 0


def cmd_dirs(args) -> int:
    idx = load_index(args.index)
    by_cat: dict[str, list[dict]] = defaultdict(list)
    for it in idx["items"]:
        by_cat[it["category"]].append(it)
    print(f'{"类别":<20}{"数量":>6}{"大小":>10}  说明')
    for k in sorted(by_cat, key=lambda x: -len(by_cat[x])):
        rows = by_cat[k]
        mb = sum(r["bytes"] for r in rows) / 1024 / 1024
        kinds = defaultdict(int)
        for r in rows:
            kinds[r["kind"]] += 1
        desc = " ".join(f"{v}{kk}" for kk, v in sorted(kinds.items()))
        print(f"{k:<20}{len(rows):>6}{mb:>9.1f}M  {desc}")
    return 0


def cmd_stats(args) -> int:
    idx = load_index(args.index)
    items = idx["items"]
    print(f'索引根：{idx["root"]}')
    print(f'条目数：{len(items)}')
    kinds: dict[str, int] = defaultdict(int)
    for it in items:
        kinds[it["kind"]] += 1
    print("类型：" + ", ".join(f"{k}={v}" for k, v in sorted(kinds.items())))

    imgs = [i for i in items if i["kind"] == "image" and i.get("w")]
    if imgs:
        wh: dict[str, int] = defaultdict(int)
        for i in imgs:
            wh[f'{i["w"]}x{i["h"]}'] += 1
        print("\n最常见的 10 种尺寸：")
        for k, v in sorted(wh.items(), key=lambda kv: -kv[1])[:10]:
            print(f"  {k:>12}  {v}")
        alpha_n = sum(1 for i in imgs if i.get("alpha"))
        print(f"\n带透明通道：{alpha_n} / {len(imgs)}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="素材库索引与检索")
    ap.add_argument("--index", default=DEFAULT_INDEX)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("scan", help="扫描并建索引")
    p.add_argument("root", nargs="?", default=DEFAULT_ROOT)
    p.add_argument("-o", "--out", default=DEFAULT_INDEX)

    p = sub.add_parser("find", help="按关键词检索")
    p.add_argument("keyword")
    p.add_argument("--kind", choices=["image", "audio", "font", "other"])
    p.add_argument("--category")
    p.add_argument("--min-w", type=int, default=0)
    p.add_argument("--limit", type=int, default=40)

    sub.add_parser("dirs", help="按类别汇总")
    sub.add_parser("stats", help="总体统计")

    args = ap.parse_args()
    return {"scan": cmd_scan, "find": cmd_find, "dirs": cmd_dirs, "stats": cmd_stats}[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
