# 批量生成二次元风格的看板娘动作库。
# 每个动作：Grok 生成 6 秒 -> pack 脚本转码并登记进 clips.js 的 taps.any（运行时随机轮换）。

$runner = "E:\deepseek工作区\game-lab\tools\vendor\imagine-batch-runner"
$tools = "E:\deepseek工作区\game-lab\tools"
$frames = "$env:USERPROFILE\Desktop\看板娘首帧"
$dl = "$runner\downloads\mascot"

# 统一的演出约束：固定机位、静态背景、最后回到原姿势（免倒放）
$tail = "fixed camera, no camera movement, background stays completely static, and she smoothly settles back into the exact original standing pose at the end"

$acts = @(
    # ---- 月城小夜：元气樱花步枪手（act1 挥手已完成）----
    @{ c = "sayo"; slot = 2; name = "rifle-pose"
       p = "anime-style dynamic motion, high quality 2D animation: she lifts her white sakura rifle and strikes a cool confident combat pose, aiming slightly toward the viewer with a sharp determined gaze, her long dark-purple hair and wide jacket sleeves swirling in the wind, sakura petals scattering around her, dramatic rim lighting" },
    @{ c = "sayo"; slot = 3; name = "lookback"
       p = "anime-style dynamic motion, high quality 2D animation: she turns her upper body slightly and glances back over her shoulder at the viewer with a soft knowing smile, one strand of hair drifting across her face, gentle sparkling highlights in her purple eyes, sakura petals floating past" },

    # ---- 神代绫：冷静银发队长 ----
    @{ c = "aya"; slot = 1; name = "draw-blade"
       p = "anime-style dynamic motion, high quality 2D animation: she draws her long blue katana from its scabbard in one swift elegant motion, a bright arc of light along the blade, her short silver hair and white uniform sleeves flaring with the movement, a calm confident expression with a faint smirk, cool blue rim lighting" },
    @{ c = "aya"; slot = 2; name = "pistol-ready"
       p = "anime-style dynamic motion, high quality 2D animation: she raises her silver pistol to shoulder height and racks the slide with one smooth practiced motion, a confident sharp smile and steady blue eyes, her silver ponytail swaying, crisp highlights along the metal" },
    @{ c = "aya"; slot = 3; name = "nod"
       p = "anime-style dynamic motion, high quality 2D animation: she folds her arms and gives a small approving nod with a composed smile, her blue ribbon and silver hair shifting gently, a soft glow behind her" },

    # ---- 黑羽凛音：冷淡黑长直太刀使 ----
    @{ c = "rion"; slot = 1; name = "iaido-draw"
       p = "anime-style dynamic motion, high quality 2D animation: she performs a swift iaido draw, her black katana flashing out of the scabbard in a single clean arc, a thin cold crescent of light trailing the blade, her long black hair streaming with the motion, an intense cold red-eyed glare, dramatic dark red lighting" },
    @{ c = "rion"; slot = 2; name = "hair-toss"
       p = "anime-style dynamic motion, high quality 2D animation: she casually brushes a strand of her long black hair aside with two fingers and glances at the viewer with a cool half-lidded stare and a faint taunting smirk, red eyes catching the moonlight" },
    @{ c = "rion"; slot = 3; name = "blade-point"
       p = "anime-style dynamic motion, high quality 2D animation: she slowly raises her katana and points the blade toward the viewer with a cold challenging smile, her black and red kimono sleeves and long hair drifting, a sharp glint running down the steel" }
)

foreach ($a in $acts) {
    $frame = Join-Path $frames "$($a.c)_frame.jpg"
    $job = "$($a.c)-$($a.name)"
    Write-Host "`n########## $job ##########" -ForegroundColor Cyan
    if (-not (Test-Path $frame)) { Write-Host "  首帧缺失: $frame" -ForegroundColor Red; continue }

    Push-Location $runner
    $env:HTTPS_PROXY = "http://127.0.0.1:7897"
    $env:HTTP_PROXY = $env:HTTPS_PROXY
    node make-mascot-video.js $frame $job "$($a.p), $tail" 2>&1 | Select-String -Pattern 'uuid-match|已保存|失败|ERROR' | ForEach-Object { "  $_" }
    Pop-Location

    $src = Join-Path $dl "$job.mp4"
    if (Test-Path $src) {
        & python "$tools\pack_mascot_video.py" $src $a.c --kind action --slot $a.slot 2>&1 | Select-Object -Last 4
    } else {
        Write-Host "  未产出: $src" -ForegroundColor Red
    }
}

Write-Host "`n########## 最终体积 ##########" -ForegroundColor Green
$lv = "E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art\live_video"
foreach ($c in @("sayo", "aya", "rion")) {
    $files = Get-ChildItem "$lv\$c" -File -ErrorAction SilentlyContinue
    $sum = ($files | Measure-Object Length -Sum).Sum
    Write-Host ("  {0,-6} {1,7:N2} MB   ({2} 个文件)" -f $c, ($sum / 1MB), $files.Count)
}
$tot = (Get-ChildItem $lv -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
Write-Host ("  {0,-6} {1,7:N2} MB" -f "总计", ($tot / 1MB))
