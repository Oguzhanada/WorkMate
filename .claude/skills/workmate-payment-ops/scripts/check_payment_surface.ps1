param(
  [Parameter(Mandatory = $false)]
  [string]$RepoRoot = "C:\Users\Ada\Git\Python\WorkMate"
)

$ErrorActionPreference = "Stop"

$requiredPaths = @(
  "marketplace\app\api\connect\create-secure-hold\route.ts",
  "marketplace\app\api\connect\capture-payment\route.ts",
  "marketplace\app\api\webhooks\stripe\route.ts",
  "marketplace\app\api\disputes\route.ts"
)

$missing = @()
foreach ($relativePath in $requiredPaths) {
  $fullPath = Join-Path $RepoRoot $relativePath
  if (-not (Test-Path -LiteralPath $fullPath)) {
    $missing += $relativePath
  }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing required payment surface files:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "Stripe payment surface precheck passed." -ForegroundColor Green
Write-Host "Next manual checks:" -ForegroundColor Cyan
Write-Host " 1. Validate secure hold creation"
Write-Host " 2. Validate capture/refund path"
Write-Host " 3. Validate webhook retry/idempotency behavior"
exit 0
