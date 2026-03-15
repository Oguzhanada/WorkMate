param(
  [string]$RepoRoot = "C:\Users\Ada\Git\Python\WorkMate"
)

$scanRoots = @(
  (Join-Path $RepoRoot "marketplace\components"),
  (Join-Path $RepoRoot "marketplace\app\[locale]")
)

$patterns = @("/dashboard/", "/profile")
$hits = @()

  foreach ($root in $scanRoots) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    foreach ($pattern in $patterns) {
      $files = Get-ChildItem -Path $root -Recurse -File -Include *.ts,*.tsx
      if ($files.Count -eq 0) { continue }
      $matches = Select-String -Path $files.FullName -Pattern $pattern -SimpleMatch
      if ($matches) { $hits += $matches }
    }
  }

if ($hits.Count -gt 0) {
  Write-Host "Locale route warnings (review required):" -ForegroundColor Yellow
  $hits | Select-Object -First 20 | ForEach-Object {
    Write-Host " - $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow
  }
  Write-Host "Total warnings: $($hits.Count)" -ForegroundColor Yellow
  exit 0
}

Write-Host "Locale route precheck found no obvious hardcoded patterns." -ForegroundColor Green
exit 0
