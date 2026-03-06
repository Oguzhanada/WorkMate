param(
  [string]$RepoRoot = "C:\Users\Ada\Git\Python\WorkMate",
  [string]$TargetRoot = "$HOME\.codex\skills"
)

$sourceRoot = Join-Path $RepoRoot ".claude\skills"
if (-not (Test-Path -LiteralPath $sourceRoot)) {
  Write-Error "Source skills path not found: $sourceRoot"
  exit 1
}

if (-not (Test-Path -LiteralPath $TargetRoot)) {
  New-Item -ItemType Directory -Path $TargetRoot -Force | Out-Null
}

$sourceSkills = Get-ChildItem -LiteralPath $sourceRoot -Directory | Where-Object { $_.Name -like "workmate-*" }
if ($sourceSkills.Count -eq 0) {
  Write-Host "No workmate-* skills found under $sourceRoot" -ForegroundColor Yellow
  exit 0
}

Write-Host "Syncing WorkMate skills from $sourceRoot to $TargetRoot" -ForegroundColor Cyan

foreach ($skillDir in $sourceSkills) {
  $destination = Join-Path $TargetRoot $skillDir.Name
  if (-not (Test-Path -LiteralPath $destination)) {
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
  }

  Copy-Item -LiteralPath (Join-Path $skillDir.FullName "*") -Destination $destination -Recurse -Force
  Write-Host "  -> $($skillDir.Name)" -ForegroundColor Green
}

Write-Host "WorkMate skill sync completed." -ForegroundColor Green
