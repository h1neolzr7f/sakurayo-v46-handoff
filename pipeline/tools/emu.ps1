# 安卓模拟器/真机 一条龙控制（《樱夜·尸潮》QA 用）
#
#   . E:\deepseek工作区\game-lab\tools\env.ps1
#   .\emu.ps1 start | stop | list | launch | shot <名> | tap x y | swipe x1 y1 x2 y2 [ms] | fps | install <apk> | log [过滤]
#
# 现有 AVD：YeYingQA_P7Land（横屏 QA 机）

param(
    [Parameter(Position = 0)][string]$Action = "list",
    [Parameter(Position = 1)][string]$A1,
    [Parameter(Position = 2)][string]$A2,
    [Parameter(Position = 3)][string]$A3,
    [Parameter(Position = 4)][string]$A4,
    [string]$Avd = "YeYingQA_P7Land",
    [string]$Pkg = "com.sakurayo.game"
)

$ErrorActionPreference = "Stop"
$Sdk     = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "E:\Android\android-sdk" }
$Emu     = "$Sdk\emulator\emulator.exe"
$Adb     = "$Sdk\platform-tools\adb.exe"
$Shots   = if ($env:EMU_SHOTS) { $env:EMU_SHOTS } else { "E:\deepseek工作区\game-lab\shots\emulator" }
New-Item -ItemType Directory -Force -Path $Shots | Out-Null

function Get-Device { (& $Adb devices) -split "`n" | Where-Object { $_ -match "\tdevice" } | Select-Object -First 1 }
function Need-Device {
    $d = Get-Device
    if (-not $d) { throw "没有已连接的设备。先跑 .\emu.ps1 start，或插上真机并开 USB 调试。" }
    return ($d -split "\t")[0]
}

switch ($Action.ToLower()) {
    "list" {
        Write-Host "已装 AVD：" -ForegroundColor Cyan
        & $Emu -list-avds
        Write-Host "`n已连设备：" -ForegroundColor Cyan
        & $Adb devices
    }
    "start" {
        # 纯软件渲染在 WebView 游戏上慢到无法测帧率；有可用 KVM/HAXM 时才用加速
        $accel = if ($A1) { $A1 } else { "auto" }
        $gpu   = if ($env:EMU_GPU) { $env:EMU_GPU } else { "host" }
        Write-Host "启动 AVD $Avd（gpu=$gpu accel=$accel）…" -ForegroundColor Cyan
        Start-Process -FilePath $Emu -ArgumentList @("-avd", $Avd, "-gpu", $gpu, "-accel", $accel, "-no-snapshot-load", "-no-boot-anim")
        Write-Host "等待设备上线…"
        & $Adb wait-for-device
        do { Start-Sleep -Seconds 2; $boot = (& $Adb shell getprop sys.boot_completed 2>$null) } while ($boot -notmatch "1")
        & $Adb shell wm size; & $Adb shell wm density
        Write-Host "就绪。" -ForegroundColor Green
    }
    "stop" {
        & $Adb emu kill
    }
    "install" {
        $id = Need-Device
        if (-not $A1) { throw "用法: .\emu.ps1 install <apk路径>" }
        Write-Host "安装 $A1 …（签名不一致时先 adb uninstall $Pkg）" -ForegroundColor Cyan
        & $Adb -s $id install -r $A1
    }
    "launch" {
        $id = Need-Device
        # 游戏主 Activity 名以项目 android-app 的 AndroidManifest 为准
        $act = if ($A1) { $A1 } else { "$Pkg/.MainActivity" }
        & $Adb -s $id shell am start -n $act
    }
    "shot" {
        $id = Need-Device
        $name = if ($A1) { $A1 } else { "shot-$(Get-Date -Format 'HHmmss')" }
        $remote = "/sdcard/$name.png"; $local = "$Shots\$name.png"
        & $Adb -s $id shell screencap -p $remote
        & $Adb -s $id pull $remote $local | Out-Null
        & $Adb -s $id shell rm $remote
        Write-Host "已存 $local" -ForegroundColor Green
    }
    "tap"    { $id = Need-Device; & $Adb -s $id shell input tap $A1 $A2; Write-Host "tap $A1 $A2" }
    "swipe"  {
        $id = Need-Device
        $ms = if ($A4) { $A4 } else { 300 }
        & $Adb -s $id shell input swipe $A1 $A2 $A3 $A4 $ms
        Write-Host "swipe $A1 $A2 -> $A3 $A4 (${ms}ms)"
    }
    "fps" {
        $id = Need-Device
        & $Adb -s $id shell dumpsys gfxinfo $Pkg | Select-String -Pattern "Total frames|Janky|50th|90th|95th|99th|HISTOGRAM"
    }
    "log" {
        $id = Need-Device
        if ($A1) { & $Adb -s $id logcat -v time | Select-String -Pattern $A1 }
        else     { & $Adb -s $id logcat -v time }
    }
    default { Write-Host "未知动作: $Action`n可用: start stop list launch shot tap swipe fps install log" }
}
