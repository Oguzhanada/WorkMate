param(
  [switch]$Baseline
)

$ErrorActionPreference = "Stop"

function Get-RepoName {
  $remote = git remote get-url origin 2>$null
  if ([string]::IsNullOrWhiteSpace($remote)) { return $null }
  if ($remote -match "github\.com[:/](.+?)(\.git)?$") {
    return $Matches[1]
  }
  return $null
}

function Test-GhAvailable {
  try {
    gh --version | Out-Null
    return $true
  } catch {
    return $false
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$docsDir = Join-Path $repoRoot "docs\mcp-pilot"
$dailyDir = Join-Path $docsDir "daily"
if (!(Test-Path $dailyDir)) {
  New-Item -Path $dailyDir -ItemType Directory | Out-Null
}

$today = Get-Date
$stamp = $today.ToString("yyyy-MM-dd")
$repo = Get-RepoName
$ghAvailable = Test-GhAvailable

$result = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  mode = if ($Baseline) { "baseline" } else { "daily" }
  repo = $repo
  github_cli_available = $ghAvailable
  metrics = [ordered]@{
    pr_lead_time_median_hours = $null
    issue_triage_time_median_hours = $null
    ambiguous_task_ratio_percent = $null
  }
  status = "blocked_missing_github_cli"
  notes = @()
}

if (-not $ghAvailable) {
  $result.notes += "gh CLI is not installed."
} elseif ([string]::IsNullOrWhiteSpace($repo)) {
  $result.notes += "Could not resolve GitHub repository name from origin remote."
} else {
  try {
    # NOTE: PR lead and issue triage are estimated with available API fields.
    # These are intentionally conservative for pilot trend tracking.
    $prsJson = gh pr list --repo $repo --state merged --limit 50 --json createdAt,mergedAt
    $issuesJson = gh issue list --repo $repo --state all --limit 50 --json createdAt,updatedAt

    $prs = $prsJson | ConvertFrom-Json
    $issues = $issuesJson | ConvertFrom-Json

    $prHours = @()
    foreach ($pr in $prs) {
      if ($pr.createdAt -and $pr.mergedAt) {
        $d = (New-TimeSpan -Start ([datetime]$pr.createdAt) -End ([datetime]$pr.mergedAt)).TotalHours
        if ($d -ge 0) { $prHours += [math]::Round($d, 2) }
      }
    }
    if ($prHours.Count -gt 0) {
      $sorted = $prHours | Sort-Object
      $mid = [math]::Floor($sorted.Count / 2)
      $median = if ($sorted.Count % 2 -eq 0) { ($sorted[$mid - 1] + $sorted[$mid]) / 2 } else { $sorted[$mid] }
      $result.metrics.pr_lead_time_median_hours = [math]::Round($median, 2)
    }

    # Proxy triage metric: createdAt -> first updatedAt window (approximation).
    $triageHours = @()
    foreach ($it in $issues) {
      if ($it.createdAt -and $it.updatedAt) {
        $d = (New-TimeSpan -Start ([datetime]$it.createdAt) -End ([datetime]$it.updatedAt)).TotalHours
        if ($d -ge 0) { $triageHours += [math]::Round($d, 2) }
      }
    }
    if ($triageHours.Count -gt 0) {
      $sorted = $triageHours | Sort-Object
      $mid = [math]::Floor($sorted.Count / 2)
      $median = if ($sorted.Count % 2 -eq 0) { ($sorted[$mid - 1] + $sorted[$mid]) / 2 } else { $sorted[$mid] }
      $result.metrics.issue_triage_time_median_hours = [math]::Round($median, 2)
    }

    # Ambiguous task ratio proxy:
    # issue titles containing clarification markers
    $ambiguous = 0
    foreach ($it in $issues) {
      $title = [string]$it.title
      if ($title -match "clarify|unclear|question|tbd|todo") {
        $ambiguous += 1
      }
    }
    if ($issues.Count -gt 0) {
      $result.metrics.ambiguous_task_ratio_percent = [math]::Round(($ambiguous / $issues.Count) * 100, 2)
    }

    $result.status = "ok"
    $result.notes += "Metrics collected from gh CLI API responses."
    $result.notes += "Issue triage and ambiguity metrics are proxy indicators."
  } catch {
    $result.status = "error_collecting_metrics"
    $result.notes += "Failed to collect metrics from GitHub API."
    $result.notes += $_.Exception.Message
  }
}

if ($Baseline) {
  $outPath = Join-Path $docsDir "baseline.json"
} else {
  $outPath = Join-Path $dailyDir "$stamp.json"
}

$result | ConvertTo-Json -Depth 8 | Set-Content -Path $outPath -Encoding UTF8

if (-not $Baseline) {
  $mdPath = Join-Path $dailyDir "$stamp.md"
  @"
# MCP Daily Report - $stamp

- Status: $($result.status)
- GitHub CLI available: $($result.github_cli_available)
- Repo: $($result.repo)

## Metrics
- PR lead time median (hours): $($result.metrics.pr_lead_time_median_hours)
- Issue triage time median (hours): $($result.metrics.issue_triage_time_median_hours)
- Ambiguous task ratio (%): $($result.metrics.ambiguous_task_ratio_percent)

## Notes
$(($result.notes | ForEach-Object { "- $_" }) -join "`n")
"@ | Set-Content -Path $mdPath -Encoding UTF8
}

Write-Host "Report written: $outPath"
