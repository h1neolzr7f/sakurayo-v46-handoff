#!/usr/bin/env python3
"""Build the multi-file development entry into one deterministic HTML entry.

Classic scripts are inlined in parser order. Content-pack art remains as offline
files and is copied into the requested asset root.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT_TAG = re.compile(r'<script\s+src="([^"]+)"\s*></script>', re.I)
BASE_MANIFEST = re.compile(r"var\s+manifest\s*=\s*(\[[\s\S]*?\]);")
PACK_PATH = re.compile(r'^content/packs/[a-z0-9._-]+/pack\.js$')


def read_utf8(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def manifest_specs(manifest_text: str) -> list[dict[str, object]]:
    match = BASE_MANIFEST.search(manifest_text)
    if not match:
        raise ValueError("extensions.manifest.js has no base manifest array")
    raw = json.loads(match.group(1))
    if not isinstance(raw, list):
        raise ValueError("extension manifest must be an array")
    specs: list[dict[str, object]] = []
    seen: set[str] = set()
    for index, item in enumerate(raw):
        spec = {"path": item} if isinstance(item, str) else item
        if not isinstance(spec, dict) or not isinstance(spec.get("path"), str):
            raise ValueError(f"manifest entry {index} must have a string path")
        path = str(spec["path"])
        if not PACK_PATH.fullmatch(path):
            raise ValueError(f"invalid extension path: {path}")
        if path in seen:
            raise ValueError(f"duplicate extension path: {path}")
        seen.add(path)
        when = spec.get("when")
        if when is not None:
            if not isinstance(when, dict) or not isinstance(when.get("queryParam"), str):
                raise ValueError(f"manifest condition for {path} must declare queryParam")
            if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{1,47}", str(when["queryParam"])):
                raise ValueError(f"invalid queryParam for {path}")
        specs.append({"path": path, "when": when})
    return specs


def manifest_paths(manifest_text: str) -> tuple[list[str], list[str]]:
    specs = manifest_specs(manifest_text)
    base = [str(spec["path"]) for spec in specs if spec.get("when") is None]
    conditional = [str(spec["path"]) for spec in specs if spec.get("when") is not None]
    return base, conditional


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False).replace("</", "<\\/")


def bundled_pack_block(path: str, source: str, when: object = None) -> str:
    call = f"SakurayoContent.loadBundledPack({js_string(path)},{js_string(source)});"
    if isinstance(when, dict):
        name = re.escape(str(when["queryParam"]))
        expected = re.escape(str(when.get("equals", "1")))
        call = f'if (/(?:\\?|&){name}={expected}(?:&|$)/.test(location.search||"")){{{call}}}'
    return f"<script data-sakurayo-pack={js_string(path)}>\n{call}\n</script>"


def inline_entry(source: Path) -> tuple[str, list[str]]:
    html = read_utf8(source)
    source_root = source.parent
    manifest_file = source_root / "content/extensions.manifest.js"
    manifest_text = read_utf8(manifest_file)
    specs = manifest_specs(manifest_text)

    replacements: dict[str, str] = {}
    for src in SCRIPT_TAG.findall(html):
        script_path = (source_root / src).resolve()
        if source_root.resolve() not in script_path.parents:
            raise ValueError(f"script escapes src root: {src}")
        code = read_utf8(script_path)
        if src == "content/extensions.manifest.js":
            blocks = [f"<script>\nwindow.__SAKURAYO_BUNDLED_PACKS__=true;\n{code}\n</script>"]
            for spec in specs:
                pack_path = str(spec["path"])
                blocks.append(bundled_pack_block(pack_path, read_utf8(source_root / pack_path), spec.get("when")))
            replacements[src] = "\n".join(blocks)
        else:
            replacements[src] = f"<script>\n{code}\n</script>"

    for src, replacement in replacements.items():
        html = html.replace(f'<script src="{src}"></script>', replacement, 1)
    if SCRIPT_TAG.search(html):
        raise ValueError("unresolved external script tag remains in built entry")
    return html, [str(spec["path"]) for spec in specs]


def sync_pack_art(source_root: Path, pack_paths: list[str], asset_root: Path) -> int:
    target_root = asset_root / "content-packs"
    target_root.mkdir(parents=True, exist_ok=True)
    copied = 0
    for pack_path in pack_paths:
        pack_dir = source_root / Path(pack_path).parent
        art_dir = pack_dir / "art"
        if not art_dir.is_dir():
            continue
        pack_name = pack_dir.name
        target = target_root / pack_name
        if target.exists():
            shutil.rmtree(target)
        def ignore_sources(directory: str, names: list[str]) -> list[str]:
            present = set(names)
            return [name for name in names if Path(name).suffix.lower() == ".png" and Path(name).with_suffix(".webp").name in present]

        shutil.copytree(art_dir, target, ignore=ignore_sources)
        copied += sum(1 for item in target.rglob("*") if item.is_file())
    return copied


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=str(ROOT / "src/index.html"))
    parser.add_argument("--output", default=str(ROOT / "release/樱夜尸潮_V4.2_ModKit_单入口.html"))
    parser.add_argument("--asset-root", help="Optional game/art directory receiving content-pack art")
    args = parser.parse_args()

    source = Path(args.source).resolve()
    output = Path(args.output).resolve()
    html, pack_paths = inline_entry(source)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding="utf-8", newline="\n")
    copied = sync_pack_art(source.parent, pack_paths, Path(args.asset_root).resolve()) if args.asset_root else 0
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    print(f"BUILT {output}")
    print(f"PACKS {len(pack_paths)} ART_FILES {copied}")
    print(f"SHA256 {digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
