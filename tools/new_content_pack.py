#!/usr/bin/env python3
"""Create a safe Sakurayo Content API v2 starter pack.

The generated pack contains only declarative data.  It does not patch combat
functions, and can therefore be removed without changing the core game.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PACK_ID = re.compile(r"^[a-z0-9][a-z0-9._-]{2,63}$")
FOLDER = re.compile(r"^[a-z0-9][a-z0-9._-]{1,47}$")
MANIFEST_ARRAY = re.compile(r"(var\s+manifest\s*=\s*)(\[[\s\S]*?\])(\s*;)")


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def pack_source(pack_id: str, title: str) -> str:
    return f'''(function () {{
  "use strict";
  SakurayoContent.register({{
    id: {js_string(pack_id)},
    version: 1,
    apiVersion: 2,
    game: {{ min: "4.2.0", maxExclusive: "5.0.0" }},
    dependencies: [],
    conflicts: [],
    title: {js_string(title)},
    description: "由 Mod Kit 脚手架创建的声明式内容包。",
    saveDefaults: {{ purchases: {{}}, flags: {{}} }},
    migrations: [],
    assets: {{}},
    shop: {{
      costumes: [],
      items: [{{
        id: "starter_note",
        n: "扩展作者手记",
        i: "🧩",
        price: 12,
        max: 1,
        d: "示例收藏品；购买状态只保存在本内容包命名空间。"
      }}]
    }},
    achievements: [{{
      id: "first_install",
      n: "第一次魔改",
      i: "🛠️",
      d: "取得扩展作者手记",
      r: 12,
      condition: {{ type: "ownedItem", itemId: "starter_note" }}
    }}],
    stories: [{{
      id: "author_note",
      n: "扩展档案：作者手记",
      i: "📎",
      d: "这个档案由独立内容包追加，没有修改战斗核心。",
      unlock: {{ type: "ownedItem", itemId: "starter_note" }}
    }}],
    explorations: [],
    texts: {{ installed: {js_string(title + " 已启用")} }}
  }});
}})();
'''


def register_manifest(manifest_path: Path, relative_pack_path: str) -> None:
    text = manifest_path.read_text(encoding="utf-8")
    match = MANIFEST_ARRAY.search(text)
    if not match:
        raise ValueError(f"manifest array not found: {manifest_path}")
    entries = json.loads(match.group(2))
    if any((entry if isinstance(entry, str) else entry.get("path")) == relative_pack_path for entry in entries):
        raise ValueError(f"manifest already contains {relative_pack_path}")
    insert_at = next(
        (index for index, entry in enumerate(entries) if isinstance(entry, dict) and entry.get("when") is not None),
        len(entries),
    )
    entries.insert(insert_at, {"path": relative_pack_path})
    rendered = json.dumps(entries, ensure_ascii=False, indent=4)
    manifest_path.write_text(
        text[: match.start()] + match.group(1) + rendered + match.group(3) + text[match.end() :],
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a Sakurayo Content API v2 starter pack")
    parser.add_argument("pack_id", help="globally unique id, e.g. author.my-pack")
    parser.add_argument("--folder", help="folder name; defaults to the final id segment")
    parser.add_argument("--title", default="我的樱夜扩展", help="display title")
    parser.add_argument("--project-root", type=Path, default=ROOT)
    parser.add_argument("--no-register", action="store_true", help="do not edit extensions.manifest.js")
    parser.add_argument("--dry-run", action="store_true", help="validate and print destinations only")
    args = parser.parse_args()

    folder = args.folder or args.pack_id.rsplit(".", 1)[-1]
    if not PACK_ID.fullmatch(args.pack_id):
        parser.error("pack_id must match ^[a-z0-9][a-z0-9._-]{2,63}$")
    if not FOLDER.fullmatch(folder):
        parser.error("folder must use 2-48 lowercase ASCII letters, digits, dot, underscore or hyphen")

    root = args.project_root.resolve()
    pack_dir = root / "src" / "content" / "packs" / folder
    pack_file = pack_dir / "pack.js"
    art_readme = pack_dir / "art" / "README.md"
    manifest = root / "src" / "content" / "extensions.manifest.js"
    relative = f"content/packs/{folder}/pack.js"

    if pack_dir.exists():
        parser.error(f"destination already exists: {pack_dir}")
    if not args.no_register and not manifest.is_file():
        parser.error(f"manifest not found: {manifest}")
    if args.dry_run:
        print(f"DRY RUN: create {pack_file}")
        print(f"DRY RUN: create {art_readme}")
        if not args.no_register:
            print(f"DRY RUN: register {relative} in {manifest}")
        return 0

    art_readme.parent.mkdir(parents=True)
    pack_file.write_text(pack_source(args.pack_id, args.title), encoding="utf-8")
    art_readme.write_text(
        "# 内容包美术\n\n把离线资源放在这里，并在 pack.js 的 assets 或条目字段中使用 "
        f"`content-packs/{folder}/...` 路径。不要使用 URL 或 CDN。\n",
        encoding="utf-8",
    )
    if not args.no_register:
        register_manifest(manifest, relative)
    print(f"CREATED: {pack_file}")
    print(f"REGISTERED: {relative}" if not args.no_register else "REGISTERED: skipped")
    print("NEXT: python tools/check_content_packs.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
