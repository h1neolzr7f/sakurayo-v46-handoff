from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets/image2/costume_manifest_v37.json"


def main() -> int:
    spec = json.loads(MANIFEST.read_text(encoding="utf-8"))
    asset_root = ROOT / "android-app/app/src/main/assets/game" / spec["assetRoot"]
    errors: list[str] = []
    checked = 0
    for character in spec["characters"]:
        for skin in spec["skins"]:
            preview = ROOT / spec["previewPattern"].replace("<character>", character).replace("<skin>", skin)
            if not preview.is_file():
                errors.append(f"missing preview: {preview.relative_to(ROOT)}")
            for filename in spec["files"]:
                target = asset_root / character / skin / filename
                if not target.is_file():
                    errors.append(f"missing asset: {target.relative_to(ROOT)}")
                    continue
                try:
                    with Image.open(target) as image:
                        image.load()
                        if image.size != (512, 512):
                            errors.append(f"unexpected size {image.size}: {target.relative_to(ROOT)}")
                        if image.mode != "RGBA":
                            image = image.convert("RGBA")
                        alpha = image.getchannel("A")
                        if not alpha.getbbox():
                            errors.append(f"empty alpha: {target.relative_to(ROOT)}")
                except Exception as exc:  # pragma: no cover - emits exact corrupt file
                    errors.append(f"decode failed {target.relative_to(ROOT)}: {exc}")
                checked += 1
    if checked != spec["expectedFiles"]:
        errors.append(f"checked {checked}, expected {spec['expectedFiles']}")
    if errors:
        print("COSTUME ASSET CHECK FAILED")
        print("\n".join(f"- {error}" for error in errors))
        return 1
    print(f"COSTUME ASSET CHECK PASS: {checked} WebP files, {spec['expectedSets']} sets")
    return 0


if __name__ == "__main__":
    sys.exit(main())
