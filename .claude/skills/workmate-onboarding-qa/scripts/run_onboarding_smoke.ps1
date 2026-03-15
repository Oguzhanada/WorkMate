param(
  [Parameter(Mandatory = $false)]
  [string]$RepoRoot = "C:\Users\Ada\Git\Python\WorkMate"
)

$ErrorActionPreference = "Stop"

$requiredPaths = @(
  "marketplace\app\[locale]\become-provider\page.tsx",
  "marketplace\app\[locale]\dashboard\admin\page.tsx",
  "marketplace\components\dashboard\AdminApplicationsPanel.tsx",
  "marketplace\components\dashboard\AdminApplicationDetail.tsx",
  "marketplace\app\api\admin\provider-applications\route.ts"
)

$missing = @()
foreach ($relativePath in $requiredPaths) {
  $fullPath = Join-Path $RepoRoot $relativePath
  if (-not (Test-Path -LiteralPath $fullPath)) {
    $missing += $relativePath
  }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing required onboarding/admin files:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "Provider onboarding QA smoke precheck passed." -ForegroundColor Green
Write-Host "Next manual steps:" -ForegroundColor Cyan
Write-Host " 1. Test verified-ID flow on /[locale]/become-provider"
Write-Host " 2. Test admin document actions on /[locale]/dashboard/admin"
Write-Host " 3. Confirm no duplicate-submit behavior in admin actions"
exit 0
