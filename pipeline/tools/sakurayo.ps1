# 《樱夜·尸潮》开发快捷命令
#
#   .\sakurayo.ps1 serve            起本地服务（8000）
#   .\sakurayo.ps1 check            语法 + 内容包 + 框架冒烟（快，不联网）
#   .\sakurayo.ps1 smoke            关键单测
#   .\sakurayo.ps1 verify           全量回归（25–40 分钟，放后台）
#   .\sakurayo.ps1 build            合成单文件 HTML
#   .\sakurayo.ps1 sync-android     同步资源到 android-app
#   .\sakurayo.ps1 apk              构建 release APK（需先 sync-android）
#   .\sakurayo.ps1 status           版本/分支/工作树状态
#   .\sakurayo.ps1 ui               Playwright 巡检截图（1280x720 + 844x390）

param([Parameter(Position = 0)][string]$Action = "status")

$ErrorActionPreference = "Continue"
$Src = if ($env:SAKURAYO_SRC) { $env:SAKURAYO_SRC } else { "E:\deepseek工作区\game-lab\sakurayo\latest" }

if (-not (Test-Path "$Src\src\index.html")) { throw "找不到源码工作树: $Src" }
Set-Location $Src

function Run([string]$cmd) { Write-Host "> $cmd" -ForegroundColor Cyan; Invoke-Expression $cmd }

switch ($Action.ToLower()) {
    "serve" {
        Write-Host "本地服务：http://127.0.0.1:8000/src/index.html  （Ctrl+C 结束）" -ForegroundColor Green
        python -m http.server 8000
    }
    "check" {
        Run "python tools/static_check.py src/index.html"
        Run "python tools/check_content_packs.py"
        Run "node tests/framework_smoke.mjs"
    }
    "smoke" {
        Run "node --check src/runtime/sakurayo-lobby.js"
        Run "node --check src/runtime/sakurayo-save.js"
        Run "node tests/framework_smoke.mjs"
    }
    "verify"  { Run "powershell -ExecutionPolicy Bypass -File tools/verify.ps1" }
    "build"   { Run "python tools/build_game.py" }
    "sync-android" { Run "powershell -ExecutionPolicy Bypass -File android-app/sync-game.ps1" }
    "apk" {
        Set-Location "$Src\android-app"
        Run ".\gradlew.bat assembleRelease --no-daemon"
        Get-ChildItem "app\build\outputs\apk\release" -ErrorAction SilentlyContinue |
            Select-Object Name, @{n = 'MB'; e = { [math]::Round($_.Length / 1MB, 1) } }
    }
    "ui" { Run "node tools/sweep.mjs .\shots\ui" }
    "status" {
        Write-Host "工作树 : $Src" -ForegroundColor Cyan
        git rev-parse --abbrev-ref HEAD
        git log --oneline -3
        Write-Host "`n游戏版本:"; Get-Content VERSION -ErrorAction SilentlyContinue
        Write-Host "`n待提交改动:"; git status --short | Select-Object -First 20
    }
    default { Write-Host "未知动作: $Action`n可用: serve check smoke verify build sync-android apk ui status" }
}
