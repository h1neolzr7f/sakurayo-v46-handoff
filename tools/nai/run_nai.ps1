param(
  [ValidateSet('check','dry-run','gen')][string]$Command = 'check',
  [string]$JobId = '',
  [string]$Prompt = '',
  [string]$Out = '',
  [switch]$Force,
  [switch]$AllowBatch,
  [switch]$Greenscreen
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Python = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $Python) { $Python = Get-Command python3 }
$Script = Join-Path $PSScriptRoot 'generate.py'
$Args = @($Command)
if ($JobId) { $Args += @('--job-id', $JobId) }
if ($Prompt) { $Args += @('--prompt', $Prompt) }
if ($Out) { $Args += @('--out', $Out) }
if ($Force) { $Args += '--force' }
if ($AllowBatch) { $Args += '--allow-batch' }
if ($Greenscreen) { $Args += '--greenscreen' }
& $Python.Source -I $Script @Args
if ($LASTEXITCODE -ne 0) { throw "NAI $Command failed" }
