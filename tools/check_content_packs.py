#!/usr/bin/env python3
"""Static gate for the local content-pack convention."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

from build_game import manifest_paths, read_utf8


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
MANIFEST = SRC / "content/extensions.manifest.js"
PACK_ID = re.compile(r'\bid:\s*"([a-z0-9][a-z0-9._-]{2,63})"')
REMOTE = re.compile(r"https?://", re.I)
ASSET_REFERENCE = re.compile(r'["\'](content-packs/([a-z0-9._-]+)/[a-zA-Z0-9._/-]+\.(?:webp|png|ogg|wav|mp3))["\']', re.I)


def main() -> int:
    manifest_text = read_utf8(MANIFEST)
    base, conditional = manifest_paths(manifest_text)
    paths = base + conditional
    seen: set[str] = set()
    failures: list[str] = []
    for relative in paths:
        path = SRC / relative
        if not path.is_file():
            failures.append(f"missing pack script: {relative}")
            continue
        text = read_utf8(path)
        syntax = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
        if syntax.returncode:
            failures.append(f"pack syntax error: {relative}: {syntax.stderr.strip().splitlines()[-1]}")
        match = PACK_ID.search(text)
        if not match:
            failures.append(f"missing or invalid pack id: {relative}")
            continue
        pack_id = match.group(1)
        if pack_id in seen:
            failures.append(f"duplicate pack id: {pack_id}")
        seen.add(pack_id)
        if "SakurayoContent.register" not in text:
            failures.append(f"pack does not use registry: {relative}")
        if REMOTE.search(text):
            failures.append(f"remote URL in pack: {relative}")
        for runtime_path, folder in ASSET_REFERENCE.findall(text):
            prefix = f"content-packs/{folder}/"
            source_asset = SRC / "content/packs" / folder / "art" / runtime_path[len(prefix):]
            if not source_asset.is_file():
                failures.append(f"missing referenced asset: {relative}: {runtime_path}")

    expected_art = {
        "official-example": 21,
        "official-exploration": 8,
        "official-feedback": 10,
    }
    for pack_name, expected_minimum in expected_art.items():
        files = [item for item in (SRC / f"content/packs/{pack_name}/art").rglob("*") if item.is_file()]
        if len(files) < expected_minimum:
            failures.append(f"{pack_name} art files: expected >= {expected_minimum}, got {len(files)}")

    if failures:
        print("CONTENT PACK CHECK FAIL")
        for failure in failures:
            print(" -", failure)
        return 1
    print(f"CONTENT PACK CHECK PASS: {len(paths)} scripts, {len(base)} enabled, {len(conditional)} conditional")
    print("REGISTERED IDS:", ", ".join(sorted(seen)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
