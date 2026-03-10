param(
  [switch]$Strict
)

$ErrorActionPreference = "Stop"

function Run-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Script
  )

  Write-Host ""
  Write-Host "== $Name =="
  & $Script
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE"
  }
  Write-Host "[OK] $Name"
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$startPilot = Join-Path $PSScriptRoot "start-pilot.ps1"
$verifyReadonly = Join-Path $PSScriptRoot "verify-readonly.ps1"
$dailyReport = Join-Path $PSScriptRoot "daily-report.ps1"

if (!(Test-Path $startPilot)) { throw "Missing script: $startPilot" }
if (!(Test-Path $verifyReadonly)) { throw "Missing script: $verifyReadonly" }
if (!(Test-Path $dailyReport)) { throw "Missing script: $dailyReport" }

Write-Host "WorkMate MCP Bootstrap"
Write-Host "Repo root: $root"
Write-Host "Strict mode: $Strict"

Run-Step -Name "Preflight" -Script {
  if ($Strict) {
    pwsh -File $startPilot -Strict
  } else {
    pwsh -File $startPilot
  }
}

Run-Step -Name "Read-only guard verification" -Script {
  pwsh -File $verifyReadonly
}

Run-Step -Name "Baseline report" -Script {
  pwsh -File $dailyReport -Baseline
}

Run-Step -Name "Daily report" -Script {
  pwsh -File $dailyReport
}

Write-Host ""
Write-Host "Bootstrap completed."
Write-Host "- Baseline: docs/mcp-pilot/baseline.json"
Write-Host "- Daily reports: docs/mcp-pilot/daily/"
Write-Host "- Violation log: logs/mcp-readonly-violations.log"
