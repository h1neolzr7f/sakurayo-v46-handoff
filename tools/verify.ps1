$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

function Invoke-Step([string]$Name, [scriptblock]$Command) {
    Write-Host "==> $Name"
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}

Invoke-Step "static_check" { python tools/static_check.py src/index.html }
Invoke-Step "syntax extracted" { node --check tests/artifacts/static/index.extracted.js }
Invoke-Step "content packs" { python tools/check_content_packs.py }
Invoke-Step "syntax cutscene" { node --check src/runtime/sakurayo-cutscene.js }
Invoke-Step "syntax economy" { node --check src/runtime/sakurayo-economy.js }
Invoke-Step "syntax lobby" { node --check src/runtime/sakurayo-lobby.js }
Invoke-Step "syntax shell" { node --check src/runtime/sakurayo-shell.js }
Invoke-Step "syntax live" { node --check src/runtime/sakurayo-live.js }
Invoke-Step "syntax ops" { node --check src/runtime/sakurayo-ops.js }
Invoke-Step "syntax layout52" { node --check src/runtime/sakurayo-layout52.js }
Invoke-Step "syntax feel53" { node --check src/runtime/sakurayo-feel53.js }
Invoke-Step "syntax touch54" { node --check src/runtime/sakurayo-touch54.js }
Invoke-Step "syntax boutique" { node --check src/runtime/sakurayo-boutique.js }
Invoke-Step "syntax chrome" { node --check src/runtime/sakurayo-chrome.js }
Invoke-Step "lobby unit" { node tests/lobby_unit.mjs }
Invoke-Step "feel53 unit" { node tests/feel53_unit.mjs }
Invoke-Step "layout52 unit" { node tests/layout52_unit.mjs }
Invoke-Step "touch54 unit" { node tests/touch54_unit.mjs }
Invoke-Step "chrome unit" { node tests/chrome_unit.mjs }
Invoke-Step "regression v47" { node tests/regression_v47.mjs }
Invoke-Step "shell unit" { node tests/shell_unit.mjs }
Invoke-Step "live unit" { node tests/live_unit.mjs }
Invoke-Step "ops unit" { node tests/ops_unit.mjs }
Invoke-Step "ops smoke" { node tests/ops_smoke.mjs }
Invoke-Step "testimony smoke" { node tests/testimony_smoke.mjs }
Invoke-Step "landscape smoke" { node tests/landscape_smoke.mjs }
Invoke-Step "syntax lifecycle" { node --check src/runtime/sakurayo-lifecycle.js }
Invoke-Step "syntax content-runtime" { node --check src/runtime/sakurayo-content-runtime.js }
Invoke-Step "framework smoke" { node tests/framework_smoke.mjs }
Invoke-Step "browser smoke" { node tests/browser_smoke.mjs }
Invoke-Step "gacha visual" { node tests/gacha_visual.mjs }
Invoke-Step "player path" { node tests/player_path.mjs }

Write-Host "VERIFY PASS"
