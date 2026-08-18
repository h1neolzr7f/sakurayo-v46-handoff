#!/usr/bin/env bash
# Linux / Cloud Agent equivalent of tools/verify.ps1
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

py() {
  if command -v python3 >/dev/null 2>&1; then
    python3 "$@"
  else
    python "$@"
  fi
}

step() {
  local name="$1"
  shift
  echo "==> $name"
  "$@"
}

need_playwright() {
  node --input-type=module -e 'await import("playwright")' >/dev/null 2>&1 && return 0
  echo "FAIL: Playwright is required for ops_smoke / browser_smoke."
  echo "Install once in the repo root, then rerun:"
  echo "  npm i -D playwright"
  echo "  npx playwright install chromium"
  echo "Cloud / Linux agents must do this before claiming VERIFY PASS."
  return 1
}

step "static_check" py tools/static_check.py src/index.html
step "syntax extracted" node --check tests/artifacts/static/index.extracted.js
step "syntax cutscene" node --check src/runtime/sakurayo-cutscene.js
step "syntax economy" node --check src/runtime/sakurayo-economy.js
step "syntax lobby" node --check src/runtime/sakurayo-lobby.js
step "syntax live" node --check src/runtime/sakurayo-live.js
step "syntax ops" node --check src/runtime/sakurayo-ops.js
step "lobby unit" node tests/lobby_unit.mjs
step "live unit" node tests/live_unit.mjs
step "ops unit" node tests/ops_unit.mjs
if [[ "${VERIFY_SKIP_BROWSER:-}" == "1" ]]; then
  echo "==> ops smoke SKIPPED (VERIFY_SKIP_BROWSER=1)"
else
  need_playwright
  step "ops smoke" node tests/ops_smoke.mjs
fi
step "syntax lifecycle" node --check src/runtime/sakurayo-lifecycle.js
step "syntax content-runtime" node --check src/runtime/sakurayo-content-runtime.js
if [[ "${VERIFY_SKIP_BROWSER:-}" == "1" ]]; then
  echo "==> framework smoke SKIPPED (VERIFY_SKIP_BROWSER=1)"
  echo "==> browser smoke SKIPPED (VERIFY_SKIP_BROWSER=1)"
else
  need_playwright
  step "framework smoke" node tests/framework_smoke.mjs
  step "browser smoke" node tests/browser_smoke.mjs
fi

echo "VERIFY PASS"
