$ErrorActionPreference = "Stop"

Write-Host "== Verify MCP Read-Only Guard =="
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$guardScript = Join-Path $repoRoot "scripts\mcp\read_only_enforce.mjs"
$logFile = Join-Path $repoRoot "logs\mcp-readonly-violations.log"

if (!(Test-Path $guardScript)) {
  throw "Missing guard script: $guardScript"
}

if (Test-Path $logFile) {
  Remove-Item $logFile -Force
}

# Allowed action should pass
node $guardScript --agent QAAgent --mcp github --action "list_pull_requests" --query "state:open" --log $logFile | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Read-only guard failed on safe action."
}
Write-Host "[OK] Safe action passed"

# Write-intent action should be blocked
node $guardScript --agent BackendAgent --mcp supabase --action "update_table" --query "update profiles set full_name='x'" --log $logFile 2>$null
if ($LASTEXITCODE -eq 0) {
  throw "Read-only guard did not block write-intent action."
}
Write-Host "[OK] Write-intent action blocked"

if (!(Test-Path $logFile)) {
  throw "Violation log was not created."
}

$logLines = @(Get-Content -Path $logFile | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
if ($logLines.Count -lt 1) {
  throw "Violation log should contain at least one entry."
}

$entry = $logLines[$logLines.Count - 1] | ConvertFrom-Json
$requiredFields = @("timestamp", "agent", "mcp", "attempted_action", "blocked_reason")
foreach ($f in $requiredFields) {
  if (-not ($entry.PSObject.Properties.Name -contains $f)) {
    throw "Violation log entry missing field: $f"
  }
}

Write-Host "[OK] Violation log format verified"
Write-Host "Read-only verification completed successfully."
