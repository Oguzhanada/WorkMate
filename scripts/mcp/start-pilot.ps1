param(
  [switch]$Strict
)

$ErrorActionPreference = "Stop"

Write-Host "== WorkMate MCP Pilot Start =="
Write-Host "Mode: read-only"

$registryPath = Join-Path $PSScriptRoot "..\..\mcp\registry.json"
if (!(Test-Path $registryPath)) {
  throw "Missing registry file: $registryPath"
}

$registry = Get-Content -Raw -Path $registryPath | ConvertFrom-Json
Write-Host "Pilot: $($registry.pilot.name)"

if ($registry.pilot.mode -ne "read_only") {
  throw "Pilot mode must be read_only."
}

# GitHub healthcheck
$ghAvailable = $false
try {
  gh --version | Out-Null
  $ghAvailable = $true
} catch {
  $ghAvailable = $false
}

if ($ghAvailable) {
  Write-Host "[OK] gh CLI is available"
} else {
  Write-Warning "[WARN] gh CLI is missing (GitHub baseline/report features will be limited)"
  if ($Strict) {
    throw "Strict mode enabled and gh CLI is missing."
  }
}

# Supabase read-only env healthcheck
$requiredVars = @("SUPABASE_READONLY_URL", "SUPABASE_READONLY_ANON_KEY")
$missing = @()
foreach ($v in $requiredVars) {
  if ([string]::IsNullOrWhiteSpace((Get-Item -Path "Env:$v" -ErrorAction SilentlyContinue).Value)) {
    $missing += $v
  }
}
if ($missing.Count -gt 0) {
  Write-Warning "[WARN] Missing Supabase read-only env vars: $($missing -join ', ')"
  if ($Strict) {
    throw "Strict mode enabled and Supabase read-only env vars are missing."
  }
} else {
  Write-Host "[OK] Supabase read-only env vars detected"
}

# Ensure expected folders exist
$paths = @(
  (Join-Path $PSScriptRoot "..\..\logs"),
  (Join-Path $PSScriptRoot "..\..\docs\mcp-pilot\daily")
)
foreach ($p in $paths) {
  if (!(Test-Path $p)) {
    New-Item -Path $p -ItemType Directory | Out-Null
  }
}

Write-Host "[OK] MCP pilot preflight completed"
