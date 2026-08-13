param(
    [switch]$SkipSync
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $SkipSync) {
    & (Join-Path $projectRoot "sync-game.ps1")
}

if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "E:\Android\jdk-17"
}
if (-not $env:ANDROID_SDK_ROOT) {
    $env:ANDROID_SDK_ROOT = "E:\Android\android-sdk"
}
$env:ANDROID_HOME = $env:ANDROID_SDK_ROOT

$gradlew = Join-Path $projectRoot "gradlew.bat"
& $gradlew --offline --no-daemon assembleDebug lintDebug
if ($LASTEXITCODE -ne 0) {
    throw "Android debug build failed with exit code $LASTEXITCODE"
}

$apk = Join-Path $projectRoot "app\build\outputs\apk\debug\app-debug.apk"
$hash = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash
Write-Output "APK: $apk"
Write-Output "SHA256: $hash"
