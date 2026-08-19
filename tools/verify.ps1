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
Invoke-Step "syntax cutscene" { node --check src/runtime/sakurayo-cutscene.js }
Invoke-Step "syntax economy" { node --check src/runtime/sakurayo-economy.js }
Invoke-Step "syntax lobby" { node --check src/runtime/sakurayo-lobby.js }
Invoke-Step "syntax chronicle" { node --check src/runtime/sakurayo-chronicle.js }
Invoke-Step "syntax live" { node --check src/runtime/sakurayo-live.js }
Invoke-Step "syntax ops" { node --check src/runtime/sakurayo-ops.js }
Invoke-Step "syntax camera" { node --check src/runtime/sakurayo-camera.js }
Invoke-Step "camera unit" { node tests/camera_unit.mjs }
Invoke-Step "lobby unit" { node tests/lobby_unit.mjs }
Invoke-Step "chronicle unit" { node tests/chronicle_unit.mjs }
Invoke-Step "live unit" { node tests/live_unit.mjs }
Invoke-Step "ops unit" { node tests/ops_unit.mjs }
Invoke-Step "ops smoke" { node tests/ops_smoke.mjs }
Invoke-Step "syntax lifecycle" { node --check src/runtime/sakurayo-lifecycle.js }
Invoke-Step "syntax content-runtime" { node --check src/runtime/sakurayo-content-runtime.js }
Invoke-Step "framework smoke" { node tests/framework_smoke.mjs }
Invoke-Step "browser smoke" { node tests/browser_smoke.mjs }
Invoke-Step "packtest gate C" { node tests/packtest_gatec.mjs }

Write-Host "VERIFY PASS"
