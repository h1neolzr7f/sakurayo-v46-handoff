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
  node tests/command_smoke.mjs
  node tests/tactical_smoke.mjs
  node tests/ops_smoke.mjs
  node tests/framework_smoke.mjs
  node tests/gacha_visual.mjs
  node tests/browser_smoke.mjs
  EMU_BASE="file://$root_dir/src/index.html" node tests/emu_loop.mjs
  EMU_BASE="file://$root_dir/src/index.html" node tests/emu_scan.mjs
  SAKURAYO_ENTRY="$root_dir/android-app/app/src/main/assets/index.html" node tests/command_smoke.mjs
  SAKURAYO_ENTRY="$root_dir/android-app/app/src/main/assets/index.html" node tests/tactical_smoke.mjs
  node tests/framework_smoke.mjs android-app/app/src/main/assets/index.html
  node tests/browser_smoke.mjs android-app/app/src/main/assets/index.html
fi
echo 'VERIFY PASS'
