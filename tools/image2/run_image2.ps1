param(
  [ValidateSet('all','essential','skins','skills','progression')][string]$Phase = 'all',
  [string]$JobId = '',
  [switch]$Force,
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ManifestPath = Join-Path $Root 'assets\image2\asset_manifest.json'
$Manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$Python = 'E:\Hermes\home\hermes-agent\venv\Scripts\python.exe'
$Cli = 'C:\Users\tzzcomputer\.codex\skills\.system\imagegen\scripts\image_gen.py'
$Post = Join-Path $PSScriptRoot 'postprocess_assets.py'
if (-not (Test-Path -LiteralPath $Python)) { $Python = (Get-Command python).Source }
if (-not $env:OPENAI_API_KEY) {
  $env:OPENAI_API_KEY = [Environment]::GetEnvironmentVariable('OPENAI_API_KEY', 'User')
}
if (-not $env:OPENAI_API_KEY) {
  $env:OPENAI_API_KEY = [Environment]::GetEnvironmentVariable('OPENAI_API_KEY', 'Machine')
}
if ($DryRun -and -not $env:OPENAI_API_KEY) {
  # The bundled CLI never performs a request in dry-run mode; a sentinel keeps
  # Windows PowerShell from converting its missing-key stderr warning to a fatal
  # NativeCommandError while the invocation is being captured to a QA log.
  $env:OPENAI_API_KEY = 'dry-run-sentinel-not-a-real-key'
}
if (-not $DryRun -and -not $env:OPENAI_API_KEY) {
  throw 'OPENAI_API_KEY is not set. Set it locally, then rerun; do not paste the key into chat.'
}
$Jobs = @($Manifest.jobs | Where-Object {
  ($Phase -eq 'all' -or $_.phase -eq $Phase) -and (-not $JobId -or $_.id -eq $JobId)
})
if (-not $Jobs.Count) { throw 'No matching Image2 jobs.' }
foreach ($Job in $Jobs) {
  $Out = Join-Path $Root $Job.source
  New-Item -ItemType Directory -Force -Path (Split-Path $Out -Parent) | Out-Null
  if ((Test-Path -LiteralPath $Out) -and -not $Force) {
    Write-Host "SKIP existing $($Job.id): $Out"
  } else {
    $Args = @('-I', $Cli, 'edit', '--model', 'gpt-image-2')
    foreach ($Ref in $Manifest.reference_images) { $Args += @('--image', (Join-Path $Root $Ref)) }
    $Args += @('--prompt-file', (Join-Path $Root "assets\image2\prompts\$($Job.id).txt"), '--size', $Job.size, '--quality', $Job.quality, '--output-format', 'png', '--out', $Out)
    if ($Force) { $Args += '--force' }
    if ($DryRun) { $Args += '--dry-run' }
    Write-Host "IMAGE2 $($Job.id) [$($Job.size)]"
    $SavedErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & $Python @Args
    $ImageExitCode = $LASTEXITCODE
    $ErrorActionPreference = $SavedErrorActionPreference
    if ($ImageExitCode -ne 0) { throw "Image2 failed: $($Job.id)" }
  }
  if (-not $DryRun) {
    & $Python -I $Post --manifest $ManifestPath --job-id $Job.id
    if ($LASTEXITCODE -ne 0) { throw "Postprocess failed: $($Job.id)" }
  }
}
Write-Host "Completed $($Jobs.Count) Image2 job(s)."
