param(
  [string]$RepoRoot = "C:\Users\Ada\Git\Python\WorkMate"
)

$required = @(
  "marketplace\migrations\036_airtasker_feature_layer.sql",
  "marketplace\app\actions\task-alerts.ts",
  "marketplace\supabase\functions\match-task-alerts\index.ts"
)

$missing = @()
foreach ($r in $required) {
  if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot $r))) { $missing += $r }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing task alerts surfaces:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "Task alerts precheck passed." -ForegroundColor Green
exit 0
