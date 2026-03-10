# MCP Pilot Baseline (Pre-Pilot)

Date captured: 2026-03-09  
Window: 2026-02-09 to 2026-03-09 (last 4 weeks)

## Source and collection status
- GitHub CLI availability: **missing on host**
- GitHub auth status: **not collected**
- Supabase read-only env status: **not collected in baseline pass**

## Required baseline metrics
- PR lead time (median hours)
- Issue triage time (median hours)
- Ambiguous task ratio (% of tasks requiring clarification loop)

## Current baseline outcome
Baseline values are recorded as `null` in `baseline.json` because GitHub CLI/API access is not available in this environment yet.

## Next step to finalize baseline
1. Install `gh` CLI and authenticate with read-only token.
2. Run `scripts/mcp/start-pilot.ps1`.
3. Run `scripts/mcp/daily-report.ps1 -Baseline`.
4. Confirm `baseline.json` values are populated before Week 2 dry-run signoff.
