param([switch]$Static)

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
Get-ChildItem -Path src/runtime -Filter *.js | Sort-Object Name | ForEach-Object {
    $runtimeFile = $_.FullName
    Invoke-Step "syntax $($_.Name)" { node --check $runtimeFile }
}
Get-ChildItem -Path tests -Filter *_unit.mjs | Sort-Object Name | ForEach-Object {
    $unitFile = $_.FullName
    Invoke-Step "$($_.Name)" { node $unitFile }
}
Invoke-Step "content packs" { python tools/check_content_packs.py }
Invoke-Step "command art" { python tools/check_command_art.py }
Invoke-Step "tactical art" { python tools/check_tactical_art.py }
Invoke-Step "offline bundle" { python tools/build_game.py --output android-app/app/src/main/assets/index.html --asset-root android-app/app/src/main/assets/game/art }
Invoke-Step "offline static_check" { python tools/static_check.py android-app/app/src/main/assets/index.html --require-bundled --out tests/artifacts/static/android.bundle.extracted.js }
Invoke-Step "offline syntax extracted" { node --check tests/artifacts/static/android.bundle.extracted.js }

if (-not $Static) {
    Get-ChildItem -Path tests -Filter *_smoke.mjs | Sort-Object Name | ForEach-Object {
        $smokeFile = $_.FullName
        Invoke-Step "$($_.Name) source" { node $smokeFile }
    }
    Invoke-Step "gacha visual" { node tests/gacha_visual.mjs }
    $previousEmuBase = $env:EMU_BASE
    try {
        $env:EMU_BASE = ([System.Uri](Join-Path $root "src/index.html")).AbsoluteUri
        Invoke-Step "emu loop" { node tests/emu_loop.mjs }
        Invoke-Step "emu scan" { node tests/emu_scan.mjs }
    } finally { $env:EMU_BASE = $previousEmuBase }
    $previousEntry = $env:SAKURAYO_ENTRY
    try {
        $env:SAKURAYO_ENTRY = Join-Path $root "android-app/app/src/main/assets/index.html"
        Get-ChildItem -Path tests -Filter *_smoke.mjs | Where-Object Name -ne ui_dom_smoke.mjs | Sort-Object Name | ForEach-Object {
            $smokeFile = $_.FullName
            Invoke-Step "$($_.Name) offline" { node $smokeFile android-app/app/src/main/assets/index.html }
        }
    } finally { $env:SAKURAYO_ENTRY = $previousEntry }
}
Write-Host "VERIFY PASS"
