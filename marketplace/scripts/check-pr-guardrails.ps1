param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
)

$ErrorActionPreference = "Stop"

$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Test-RequiredFiles {
  param(
    [string]$Title,
    [string[]]$Paths
  )

  foreach ($relativePath in $Paths) {
    $fullPath = Join-Path $RepoRoot $relativePath
    if (-not (Test-Path -LiteralPath $fullPath)) {
      $errors.Add("$Title missing required file: $relativePath")
    }
  }
}

function Test-MigrationPatterns {
  param(
    [string]$MigrationsPath
  )

  if (-not (Test-Path -LiteralPath $MigrationsPath)) {
    $errors.Add("Migrations path not found: $MigrationsPath")
    return
  }

  $files = Get-ChildItem -Path $MigrationsPath -Filter *.sql -File
  foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match '(?i)FOR\s+ALL\s+USING\s*\(\s*true\s*\)') {
      $errors.Add("Migration blocked ($($file.Name)): FOR ALL USING (true)")
    }
    if ($content -match '(?i)ALTER\s+TABLE\s+[^;]+\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY') {
      $errors.Add("Migration blocked ($($file.Name)): disables RLS")
    }
    if ($content -match '(?i)\bDROP\s+TABLE\b' -or $content -match '(?i)\bTRUNCATE\s+TABLE\b') {
      $warnings.Add("Migration warning ($($file.Name)): destructive operation detected")
    }
  }
}

function Test-LocaleHardcodedPatterns {
  $scanRoots = @(
    (Join-Path $RepoRoot "marketplace\\components"),
    (Join-Path $RepoRoot "marketplace\\app\\[locale]")
  )

  $routeLiteralPattern = '["''`]/(dashboard/[^"''`]*|profile(?:[/?#][^"''`]*)?)["''`]'
  $safeLinePatterns = @(
    'withLocalePrefix\(',
    '\blocalized\(',
    '^\s*import\s'
  )
  $hits = @()

  foreach ($root in $scanRoots) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    $files = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object { $_.Extension -in '.ts', '.tsx' }
    if (-not $files -or $files.Count -eq 0) { continue }

    $matches = Select-String -Path $files.FullName -Pattern $routeLiteralPattern
    foreach ($match in $matches) {
      $isSafe = $false
      foreach ($safePattern in $safeLinePatterns) {
        if ($match.Line -match $safePattern) {
          $isSafe = $true
          break
        }
      }
      if (-not $isSafe) {
        $hits += $match
      }
    }
  }

  if ($hits.Count -gt 0) {
    $warnings.Add("Locale route scan found $($hits.Count) potential hardcoded links. Review recommended.")
  }
}

Test-RequiredFiles -Title "Admin onboarding QA" -Paths @(
  "marketplace\\app\\[locale]\\become-provider\\page.tsx",
  "marketplace\\components\\dashboard\\AdminApplicationsPanel.tsx",
  "marketplace\\components\\dashboard\\AdminApplicationDetail.tsx",
  "marketplace\\app\\api\\admin\\provider-applications\\route.ts"
)

Test-RequiredFiles -Title "Payments ops" -Paths @(
  "marketplace\\app\\api\\connect\\create-secure-hold\\route.ts",
  "marketplace\\app\\api\\connect\\capture-payment\\route.ts",
  "marketplace\\app\\api\\webhooks\\stripe\\route.ts",
  "marketplace\\app\\api\\disputes\\route.ts"
)

Test-RequiredFiles -Title "Task alerts" -Paths @(
  "marketplace\\migrations\\036_airtasker_feature_layer.sql",
  "marketplace\\app\\actions\\task-alerts.ts",
  "marketplace\\supabase\\functions\\match-task-alerts\\index.ts"
)

Test-MigrationPatterns -MigrationsPath (Join-Path $RepoRoot "marketplace\\migrations")
Test-LocaleHardcodedPatterns

if ($warnings.Count -gt 0) {
  Write-Host "Guardrail warnings:" -ForegroundColor Yellow
  $warnings | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
}

if ($errors.Count -gt 0) {
  Write-Host "Guardrail failures:" -ForegroundColor Red
  $errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "PR guardrail checks passed." -ForegroundColor Green
exit 0
