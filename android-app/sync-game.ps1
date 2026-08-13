param(
    [string]$Source = "..\src\index.html"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourcePath = [IO.Path]::GetFullPath((Join-Path $projectRoot $Source))
$targetPath = Join-Path $projectRoot "app\src\main\assets\index.html"
$assetRoot = Join-Path $projectRoot "app\src\main\assets\game\art"
$builderPath = Join-Path (Split-Path -Parent $projectRoot) "tools\build_game.py"
$staticCheckPath = Join-Path (Split-Path -Parent $projectRoot) "tools\static_check.py"
$staticOutPath = Join-Path (Split-Path -Parent $projectRoot) "tests\artifacts\static\android.bundle.extracted.js"

if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "Game source not found: $sourcePath"
}

if (-not (Test-Path -LiteralPath $builderPath -PathType Leaf)) {
    throw "Game builder not found: $builderPath"
}

& python $builderPath --source $sourcePath --output $targetPath --asset-root $assetRoot
if ($LASTEXITCODE -ne 0) {
    throw "Game bundle build failed with exit code $LASTEXITCODE"
}
$sourceHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
$targetHash = (Get-FileHash -LiteralPath $targetPath -Algorithm SHA256).Hash
$targetText = Get-Content -LiteralPath $targetPath -Raw -Encoding UTF8
& python $staticCheckPath $targetPath --out $staticOutPath --require-bundled
if ($LASTEXITCODE -ne 0) {
    throw "Android bundle static validation failed with exit code $LASTEXITCODE"
}
if ($targetText -notmatch 'official\.framework-example' -or $targetText -notmatch 'CONTENT PACK ADAPTER') {
    throw "Android bundle validation failed: content runtime or official pack missing."
}

$coreManifestPath = Join-Path (Split-Path -Parent $projectRoot) "assets\image2\builtin_core_manifest.json"
if (-not (Test-Path -LiteralPath $coreManifestPath -PathType Leaf)) {
    throw "Core art manifest not found: $coreManifestPath"
}
$coreManifest = Get-Content -LiteralPath $coreManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$assetRoot = Join-Path $projectRoot "app\src\main\assets"
$expectedArt = @($coreManifest.jobs | ForEach-Object { $_.grid.cells } | ForEach-Object { $_.output })
$missingArt = @($expectedArt | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $assetRoot $_) -PathType Leaf)
})
if ($missingArt.Count -gt 0) {
    throw "Core art validation failed. Missing: $($missingArt -join ', ')"
}

$fullManifestPath = Join-Path (Split-Path -Parent $projectRoot) "assets\image2\asset_manifest.json"
if (-not (Test-Path -LiteralPath $fullManifestPath -PathType Leaf)) {
    throw "Full art manifest not found: $fullManifestPath"
}
$fullManifest = Get-Content -LiteralPath $fullManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$remainingUiJobIds = @("atlas_progression_a", "atlas_progression_b", "atlas_skills_a", "atlas_skills_b", "atlas_branding")
$remainingUiArt = @($fullManifest.jobs | Where-Object { $_.id -in $remainingUiJobIds } | ForEach-Object { $_.grid.cells } | ForEach-Object { $_.output })
$missingRemainingUi = @($remainingUiArt | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $assetRoot $_) -PathType Leaf)
})
if ($remainingUiArt.Count -ne 116 -or $missingRemainingUi.Count -gt 0) {
    throw "Remaining UI art validation failed. Expected 116, found $($remainingUiArt.Count). Missing: $($missingRemainingUi -join ', ')"
}

$animationManifestPath = Join-Path (Split-Path -Parent $projectRoot) "assets\image2\animation_manifest.json"
$animationManifest = Get-Content -LiteralPath $animationManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$animationArt = @($animationManifest.jobs | ForEach-Object { $_.grid.cells } | ForEach-Object { $_.output })
$missingAnimationArt = @($animationArt | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $assetRoot $_) -PathType Leaf)
})
if ($animationArt.Count -ne 15 -or $missingAnimationArt.Count -gt 0) {
    throw "Character animation art validation failed. Expected 15, found $($animationArt.Count). Missing: $($missingAnimationArt -join ', ')"
}

$costumeManifestPath = Join-Path (Split-Path -Parent $projectRoot) "assets\image2\costume_manifest_v37.json"
$costumeManifest = Get-Content -LiteralPath $costumeManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$costumeArt = @(
    foreach ($character in $costumeManifest.characters) {
        foreach ($skin in $costumeManifest.skins) {
            foreach ($file in $costumeManifest.files) {
                "game/art/characters/$character/$skin/$file"
            }
        }
    }
)
$missingCostumeArt = @($costumeArt | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $assetRoot $_) -PathType Leaf)
})
if ($costumeArt.Count -ne [int]$costumeManifest.expectedFiles -or $missingCostumeArt.Count -gt 0) {
    throw "Costume art validation failed. Expected $($costumeManifest.expectedFiles), found $($costumeArt.Count). Missing: $($missingCostumeArt -join ', ')"
}

Write-Output "Synced bundled game asset: $targetPath"
Write-Output "Source SHA256: $sourceHash"
Write-Output "Bundle SHA256: $targetHash"
Write-Output "Validated core art assets: $($expectedArt.Count)"
Write-Output "Validated remaining UI art assets: $($remainingUiArt.Count)"
Write-Output "Validated character animation assets: $($animationArt.Count)"
Write-Output "Validated costume art assets: $($costumeArt.Count)"
