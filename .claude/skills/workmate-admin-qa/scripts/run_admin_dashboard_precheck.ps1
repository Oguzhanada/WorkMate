param(
  [string]$RepoRoot = "C:\Users\Ada\Git\Python\WorkMate"
)

$required = @(
  "marketplace\components\dashboard\AdminApplicationsPanel.tsx",
  "marketplace\components\dashboard\AdminApplicationDetail.tsx",
  "marketplace\app\api\admin\provider-applications\route.ts"
)

$missing = @()
foreach ($r in $required) {
  if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot $r))) { $missing += $r }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing admin QA surfaces:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "Admin dashboard precheck passed." -ForegroundColor Green
exit 0
