param(
  [Parameter(Mandatory = $false)]
  [string]$MigrationPath = "marketplace/migrations"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $MigrationPath)) {
  Write-Error "Path not found: $MigrationPath"
  exit 1
}

$target = Resolve-Path $MigrationPath
$files = @()

if ((Get-Item $target).PSIsContainer) {
  $files = Get-ChildItem -Path $target -Filter *.sql -File | Sort-Object Name
} else {
  $item = Get-Item $target
  if ($item.Extension -ne ".sql") {
    Write-Error "Target file must be .sql: $target"
    exit 1
  }
  $files = @($item)
}

if ($files.Count -eq 0) {
  Write-Error "No .sql migration files found in: $target"
  exit 1
}

$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

foreach ($file in $files) {
  $content = Get-Content -Path $file.FullName -Raw

  if ($file.Name -notmatch '^[0-9]{3}_.+\.sql$') {
    $warnings.Add("$($file.Name): filename does not match expected pattern 000_name.sql")
  }

  if ($content -match '(?i)FOR\s+ALL\s+USING\s*\(\s*true\s*\)') {
    $errors.Add("$($file.Name): forbidden policy pattern FOR ALL USING (true)")
  }

  if ($content -match '(?i)USING\s*\(\s*true\s*\)') {
    $warnings.Add("$($file.Name): broad USING (true) found; verify this is intentional and safe")
  }

  if ($content -match '(?i)ALTER\s+TABLE\s+[^;]+\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY') {
    $errors.Add("$($file.Name): disabling RLS is blocked by default")
  }

  if ($content -match '(?i)DROP\s+TABLE\s+' -or $content -match '(?i)TRUNCATE\s+TABLE\s+') {
    $warnings.Add("$($file.Name): destructive operation detected; require explicit approval")
  }

  if ($content -match '(?i)\b(united\s+states|usa|us\s+zip\s+code)\b') {
    $warnings.Add("$($file.Name): non-Ireland locality keyword found; confirm Ireland-first alignment")
  }
}

if ($warnings.Count -gt 0) {
  Write-Host "Warnings:" -ForegroundColor Yellow
  $warnings | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
}

if ($errors.Count -gt 0) {
  Write-Host "Blocking issues:" -ForegroundColor Red
  $errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 2
}

Write-Host "Migration guardrail checks passed for $($files.Count) file(s)." -ForegroundColor Green
exit 0
