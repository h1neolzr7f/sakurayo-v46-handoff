# game-lab 环境初始化 —— 点号加载即可让本会话拿到 Android 工具链
#   . E:\deepseek工作区\game-lab\tools\env.ps1
#
# 只影响当前 PowerShell 进程，不改系统环境变量。

$GameLab = "E:\deepseek工作区\game-lab"
$Sdk     = "E:\Android\android-sdk"

# 本机系统代理（Clash/Mihomo 默认端口）。环境变量里没有，GitHub 直连会超时，
# 所以这里显式导出，curl / gradle / pnpm 都吃这个变量。
if (-not $env:HTTPS_PROXY) {
    $proxy = "http://127.0.0.1:7897"
    $probe = Test-NetConnection -ComputerName 127.0.0.1 -Port 7897 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($probe) {
        $env:HTTP_PROXY  = $proxy
        $env:HTTPS_PROXY = $proxy
        $env:NO_PROXY    = "localhost,127.0.0.1,::1"
    }
}

$env:ANDROID_HOME     = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk
# 千万不要设 GRADLE_USER_HOME：默认的 ~\.gradle 里有完整的 Gradle 分发（约 2.2 GB）
# 和依赖缓存（约 2.6 GB）。指到别的目录会让 Gradle 认为缓存缺失，转而联网重下。
# 实测踩过：指向 E:\Android\gradle-home 后 gradlew 直接去下载 gradle-8.14.1-bin.zip 并超时。
$env:JAVA_HOME        = "E:\Android\jdk-17"

$paths = @(
    "$Sdk\platform-tools",
    "$Sdk\emulator",
    "$Sdk\cmdline-tools\latest\bin",
    "$Sdk\build-tools\36.0.0",
    "$GameLab\tools\bin",
    "$GameLab\tools\bin\jadx\bin"
)
foreach ($p in $paths) {
    if ((Test-Path $p) -and ($env:PATH -notlike "*$p*")) { $env:PATH = "$env:PATH;$p" }
}

# 已有 AVD
$env:EMU_AVD     = "YeYingQA_P7Land"
$env:EMU_SHOTS   = "$GameLab\shots\emulator"
$env:SAKURAYO_SRC = "$GameLab\sakurayo\latest"

New-Item -ItemType Directory -Force -Path $env:EMU_SHOTS | Out-Null

$adbCmd = Get-Command adb -ErrorAction SilentlyContinue

Write-Host "game-lab 环境已加载" -ForegroundColor Cyan
Write-Host "  ANDROID_HOME : $env:ANDROID_HOME"
Write-Host "  JAVA_HOME    : $env:JAVA_HOME"
Write-Host "  AVD          : $env:EMU_AVD"
Write-Host "  源码工作树   : $env:SAKURAYO_SRC"
if ($adbCmd) { Write-Host "  adb          : $($adbCmd.Source)" } else { Write-Host "  adb          : 未找到" }
