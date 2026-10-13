# 把已生成的看板娘片段全部按"不倒放"重处理一遍。
# 源文件在 imagine-batch-runner/downloads/mascot/ 下，都是 Grok 原始 6 秒素材。

$tools = "E:\deepseek工作区\game-lab\tools"
$src = "E:\deepseek工作区\game-lab\tools\vendor\imagine-batch-runner\downloads\mascot"

$jobs = @(
    @{ f = "sayo-final.mp4";    c = "sayo"; k = "idle" },
    @{ f = "sayo-taphead.mp4";  c = "sayo"; k = "tap_head" },
    @{ f = "sayo-tapbody.mp4";  c = "sayo"; k = "tap_body" },
    @{ f = "sayo-act1.mp4";     c = "sayo"; k = "action"; s = 1 },
    @{ f = "sayo-act2.mp4";     c = "sayo"; k = "action"; s = 2 },
    @{ f = "sayo-act3.mp4";     c = "sayo"; k = "action"; s = 3 },
    @{ f = "aya-final.mp4";     c = "aya";  k = "idle" },
    @{ f = "aya-taphead.mp4";   c = "aya";  k = "tap_head" },
    @{ f = "aya-tapbody.mp4";   c = "aya";  k = "tap_body" },
    @{ f = "rion-final.mp4";    c = "rion"; k = "idle" },
    @{ f = "rion-taphead.mp4";  c = "rion"; k = "tap_head" },
    @{ f = "rion-tapbody2.mp4"; c = "rion"; k = "tap_body" }
)

foreach ($j in $jobs) {
    $p = Join-Path $src $j.f
    if (-not (Test-Path $p)) { Write-Host "[skip] $($j.f) 不存在" -ForegroundColor DarkGray; continue }
    Write-Host "`n===== $($j.c) / $($j.k) / $($j.f) =====" -ForegroundColor Cyan
    $args = @("$tools\pack_mascot_video.py", $p, $j.c, "--kind", $j.k)
    if ($j.s) { $args += @("--slot", "$($j.s)") }
    & python @args 2>&1 | Select-Object -Last 6
}

Write-Host "`n===== 最终体积 =====" -ForegroundColor Green
$lv = "E:\deepseek工作区\game-lab\sakurayo\latest\android-app\app\src\main\assets\game\art\live_video"
foreach ($c in @("sayo", "aya", "rion")) {
    $sum = (Get-ChildItem "$lv\$c" -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    Write-Host ("  {0,-6} {1,7:N2} MB" -f $c, ($sum / 1MB))
}
$tot = (Get-ChildItem $lv -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
Write-Host ("  {0,-6} {1,7:N2} MB" -f "总计", ($tot / 1MB))
