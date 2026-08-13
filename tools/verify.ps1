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
Invoke-Step "syntax lifecycle" { node --check src/runtime/sakurayo-lifecycle.js }
Invoke-Step "syntax content-runtime" { node --check src/runtime/sakurayo-content-runtime.js }
Invoke-Step "framework smoke" { node tests/framework_smoke.mjs }
Invoke-Step "browser smoke" { node tests/browser_smoke.mjs }

Write-Host "VERIFY PASS"
