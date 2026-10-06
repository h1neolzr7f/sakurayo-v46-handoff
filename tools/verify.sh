#!/usr/bin/env bash
set -euo pipefail
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

python tools/static_check.py src/index.html
node --check tests/artifacts/static/index.extracted.js
for runtime_file in src/runtime/*.js; do node --check "$runtime_file"; done
for unit_file in tests/*_unit.mjs; do node "$unit_file"; done
python tools/check_content_packs.py
python tools/check_command_art.py
python tools/check_tactical_art.py
python tools/build_game.py --output android-app/app/src/main/assets/index.html --asset-root android-app/app/src/main/assets/game/art
python tools/static_check.py android-app/app/src/main/assets/index.html --require-bundled --out tests/artifacts/static/android.bundle.extracted.js
node --check tests/artifacts/static/android.bundle.extracted.js

if [[ "${1:-}" != "--static" ]]; then
  for smoke_file in tests/*_smoke.mjs; do node "$smoke_file"; done
  node tests/gacha_visual.mjs
  EMU_BASE="file://$root_dir/src/index.html" node tests/emu_loop.mjs
  EMU_BASE="file://$root_dir/src/index.html" node tests/emu_scan.mjs
  for smoke_file in tests/*_smoke.mjs; do
    if [[ "$smoke_file" == "tests/ui_dom_smoke.mjs" ]]; then continue; fi
    SAKURAYO_ENTRY="$root_dir/android-app/app/src/main/assets/index.html" node "$smoke_file" android-app/app/src/main/assets/index.html
  done
fi
echo 'VERIFY PASS'
