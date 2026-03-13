<#
.SYNOPSIS
  Detects drift between skill files and canonical sources (agents.md, migrations).
.DESCRIPTION
  Checks all SKILL.md files under .claude/skills/ for:
  1. Stale migration numbers
  2. Pre-DR-010 Zod schema patterns (add to api.ts)
  3. Removed tool references (Backstop, proxy.ts)
  4. Missing metadata frontmatter fields
  5. Stale last_synced dates (>30 days)
  6. DR reference completeness (FD-01 without DR-010, etc.)
.NOTES
  Exit code 0 = all pass, 1 = any FAIL
#>

param(
  [string]$RepoRoot = "C:\Users\Ada\Git\Python\WorkMate"
)

$skillRoot = Join-Path $RepoRoot ".claude\skills"
$migrationDir = Join-Path $RepoRoot "marketplace\migrations"

$fails = 0
$warns = 0
$passes = 0

Write-Host ""
Write-Host "SKILL DRIFT LINT - $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor Cyan
Write-Host ""

# --- Determine latest migration number from filesystem ---
$latestMigration = Get-ChildItem -LiteralPath $migrationDir -Filter "*.sql" -ErrorAction SilentlyContinue |
  ForEach-Object { if ($_.Name -match '^(\d{3})') { [int]$Matches[1] } } |
  Sort-Object -Descending |
  Select-Object -First 1

$nextMigration = $latestMigration + 1

Write-Host "Canonical: latest migration = $latestMigration, next = $nextMigration" -ForegroundColor DarkGray
Write-Host ""

# --- Get all SKILL.md files ---
$skillFiles = Get-ChildItem -LiteralPath $skillRoot -Recurse -Filter "SKILL.md" -ErrorAction SilentlyContinue

foreach ($file in $skillFiles) {
  $skillName = $file.Directory.Name
  $content = Get-Content -LiteralPath $file.FullName -Raw
  $lines = Get-Content -LiteralPath $file.FullName
  $fileIssues = @()

  # --- Check 1: Migration number staleness ---
  $migPatterns = @(
    'next\s*=\s*\*\*(\d{3})\*\*',
    'next\s*=\s*(\d{3})',
    '(\d{3})\s*migrations?\s*applied',
    'migrations?\s*001[-\u2013](\d{3})'
  )
  foreach ($pat in $migPatterns) {
    $migMatches = [regex]::Matches($content, $pat)
    foreach ($m in $migMatches) {
      $found = [int]$m.Groups[1].Value
      if ($found -lt $latestMigration) {
        $lineNum = 0
        $escaped = [regex]::Escape($m.Value)
        for ($i = 0; $i -lt $lines.Count; $i++) {
          if ($lines[$i] -match $escaped) { $lineNum = $i + 1; break }
        }
        $msg = "  FAIL: Migration ref is stale (found $found, latest $latestMigration) - line $lineNum"
        $fileIssues += $msg
        $fails++
      }
    }
  }

  # --- Check 2: Pre-DR-010 Zod pattern ---
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $isAddToApi = [regex]::IsMatch($line, '(?i)(add|append|put|write).+schema.+(to|in)\s+.+api\.ts')
    $isSchemasInApi = [regex]::IsMatch($line, '(?i)schemas?\s+in\s+`?lib/validation/api\.ts')
    $isBarrelRef = [regex]::IsMatch($line, '(?i)(barrel|re-export)')
    if (($isAddToApi -or $isSchemasInApi) -and (-not $isBarrelRef)) {
      $msg = "  FAIL: Pre-DR-010 pattern: directs schemas to api.ts (line $($i + 1))"
      $fileIssues += $msg
      $fails++
    }
  }

  # --- Check 3: Removed tool references ---
  if ([regex]::IsMatch($content, '(?i)backstop')) {
    $fileIssues += "  FAIL: References removed tool: Backstop"
    $fails++
  }
  # proxy.ts check: skip lines that say "MUST NOT exist" (FD-28 rule definition)
  $proxyLines = $lines | Where-Object { $_ -match 'proxy\.ts' -and $_ -notmatch '(?i)(must not|never|deleted|removed|do not)' }
  if ($proxyLines) {
    $fileIssues += "  FAIL: References removed file: proxy.ts"
    $fails++
  }

  # --- Check 4: Missing metadata frontmatter ---
  $hasMetadata = $content -match 'metadata:'
  $hasSeverity = [regex]::IsMatch($content, 'severity:\s*(critical|standard)')
  $hasLastSynced = [regex]::IsMatch($content, 'last_synced:\s*\d{4}-\d{2}-\d{2}')

  if (-not $hasMetadata) {
    $fileIssues += "  FAIL: Missing metadata block in frontmatter"
    $fails++
  } elseif (-not $hasSeverity) {
    $fileIssues += "  FAIL: Missing metadata.severity (critical|standard)"
    $fails++
  }

  if (-not $hasLastSynced -and $hasMetadata) {
    $fileIssues += "  WARN: Missing metadata.last_synced date"
    $warns++
  }

  # --- Check 5: last_synced staleness ---
  if ($hasLastSynced) {
    $dateMatch = [regex]::Match($content, 'last_synced:\s*(\d{4}-\d{2}-\d{2})')
    if ($dateMatch.Success) {
      $syncDate = [datetime]::ParseExact($dateMatch.Groups[1].Value, 'yyyy-MM-dd', $null)
      $daysSince = ((Get-Date) - $syncDate).Days
      if ($daysSince -gt 30) {
        $fileIssues += "  WARN: last_synced is $daysSince days old ($($dateMatch.Groups[1].Value))"
        $warns++
      }
    }
  }

  # --- Check 6: DR reference completeness ---
  if ($content -match 'FD-01' -and $content -notmatch 'DR-010') {
    $fileIssues += "  FAIL: References FD-01 but missing DR-010 (Zod domain split)"
    $fails++
  }
  if (($content -match 'FD-05' -or $content -match 'FD-07') -and $content -notmatch 'DR-011') {
    $fileIssues += "  FAIL: References FD-05/FD-07 but missing DR-011 (layout scope)"
    $fails++
  }

  # --- Output ---
  if ($fileIssues.Count -eq 0) {
    Write-Host "PASS: $skillName" -ForegroundColor Green
    $passes++
  } else {
    Write-Host "ISSUES: $skillName" -ForegroundColor Red
    foreach ($issue in $fileIssues) {
      if ($issue -match 'FAIL') {
        Write-Host $issue -ForegroundColor Red
      } else {
        Write-Host $issue -ForegroundColor Yellow
      }
    }
  }
}

# --- Also check PROJECT_CONTEXT.md ---
$pcFile = Join-Path $RepoRoot "ai-context\context\PROJECT_CONTEXT.md"
if (Test-Path -LiteralPath $pcFile) {
  $pcContent = Get-Content -LiteralPath $pcFile -Raw
  $pcIssues = @()
  $pcPatterns = @(
    '(\d{3})\s*migrations?\s*applied',
    'migrations?\s*001[-\u2013](\d{3})',
    'Next\s*migration:\s*\*\*(\d{3})\*\*'
  )
  foreach ($pat in $pcPatterns) {
    $pcMigMatches = [regex]::Matches($pcContent, $pat)
    foreach ($m in $pcMigMatches) {
      $val = [int]$m.Groups[1].Value
      if ($val -lt $latestMigration) {
        $pcIssues += "  FAIL: Stale migration ref (found $val, latest $latestMigration)"
        $fails++
      }
    }
  }
  if ($pcIssues.Count -eq 0) {
    Write-Host "PASS: PROJECT_CONTEXT.md" -ForegroundColor Green
    $passes++
  } else {
    Write-Host "ISSUES: PROJECT_CONTEXT.md" -ForegroundColor Red
    foreach ($issue in $pcIssues) { Write-Host $issue -ForegroundColor Red }
  }
}

# --- Summary ---
Write-Host ""
$color = if ($fails -gt 0) { "Red" } else { "Green" }
Write-Host "Summary: $fails FAIL, $warns WARN, $passes PASS" -ForegroundColor $color

if ($fails -gt 0) { exit 1 } else { exit 0 }
