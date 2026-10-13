# 批量生成 PV（Boss / 章节过场 / 抽卡）—— 16:9 横屏演出素材。
# 每个：Grok 生成 6 秒 -> 转码 1280x720 -> 落到 art/pv/<类别>/

$runner = "E:\deepseek工作区\game-lab\tools\vendor\imagine-batch-runner"
$frames = "E:\deepseek工作区\game-lab\assets\pv-frames"
$dl = "$runner\downloads\mascot"
$pvout = "E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art\pv"

$tail = "fixed camera, no camera movement, background stays completely static"

# name = 输出名；frame = 首帧文件；dir = 归类子目录；prompt = 演出描述
$pv = @(
    @{ name = "boss_phase2"; dir = "boss"; frame = "boss_phase2_frame.png"
       p = "anime-style dramatic boss emergence, high quality 2D animation: the void girl slowly materializes while purple crystal shards drift and rotate around her, dark tendrils stretching outward from the edges of the frame, a cold purple light pulsing in her eye, dark particles floating upward, her robe and long hair drifting in slow supernatural motion" },
    @{ name = "boss_phase4"; dir = "boss"; frame = "boss_phase4_frame.png"
       p = "anime-style dramatic boss enrage, high quality 2D animation: the glowing purple core eye on her chest pulses with intense light, her many dark tendrils whip and coil menacingly, crystal shards scattering and orbiting around her, dense dark energy swirling, dramatic purple and magenta glow pulsing across the scene" }
)

foreach ($j in $pv) {
    $frame = Join-Path $frames $j.frame
    if (-not (Test-Path $frame)) { Write-Host "[skip] $($j.frame) 不存在" -ForegroundColor DarkGray; continue }
    Write-Host "`n########## $($j.name) ##########" -ForegroundColor Cyan

    Push-Location $runner
    $env:HTTPS_PROXY = "http://127.0.0.1:7897"
    $env:HTTP_PROXY = $env:HTTPS_PROXY
    node make-mascot-video.js $frame $j.name "$($j.p), $tail" 2>&1 |
        Select-String -Pattern 'uuid-match|已保存|失败|ERROR' | ForEach-Object { "  $_" }
    Pop-Location

    $src = Join-Path $dl "$($j.name).mp4"
    if (-not (Test-Path $src)) { Write-Host "  未产出: $src" -ForegroundColor Red; continue }

    $outdir = Join-Path $pvout $j.dir
    New-Item -ItemType Directory -Force -Path $outdir | Out-Null

    # PV 是全屏播放：720p + 较快 CRF，但比看板娘保留更多质量
    $mp4 = Join-Path $outdir "$($j.name).mp4"
    $webm = Join-Path $outdir "$($j.name).webm"
    $vf = "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30"

    ffmpeg -y -v error -i $src -vf $vf -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 24 -preset slow -an -movflags +faststart $mp4
    ffmpeg -y -v error -i $src -vf $vf -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -deadline good -cpu-used 3 -an $webm

    foreach ($f in @($mp4, $webm)) {
        if (Test-Path $f) {
            Write-Host ("  {0,-16} {1,8:N0} KB" -f (Split-Path $f -Leaf), ((Get-Item $f).Length / 1KB))
        }
    }
}

Write-Host "`n########## PV 目录 ##########" -ForegroundColor Green
Get-ChildItem $pvout -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host ("  {0,-34} {1,8:N0} KB" -f $_.FullName.Replace("$pvout\", ''), ($_.Length / 1KB))
}
