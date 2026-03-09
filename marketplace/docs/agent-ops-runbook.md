# WorkMate Agent Ops Runbook (MCP Pilot)

This runbook defines the daily operating model for the read-only MCP pilot.

## 1) Daily operating loop
1. **Triage**: collect open PR checks, open issues, and priority blockers.
2. **Analyze**: map blocker to owner agent and required context.
3. **Propose**: create decision-complete task handoff (goal, acceptance criteria, risks).
4. **Verify**: run guard scripts and confirm read-only policy adherence.
5. **Report**: generate daily report and append pilot evidence.

## 2) Required artifacts per day
- MCP healthcheck result (`scripts/mcp/start-pilot.ps1` output)
- Read-only verification result (`scripts/mcp/verify-readonly.ps1`)
- Daily metrics file (`docs/mcp-pilot/daily/YYYY-MM-DD.json`)
- Daily summary (`docs/mcp-pilot/daily/YYYY-MM-DD.md`)

## 3) Agent to MCP responsibilities
- **ProjectManager**:
  - Reads GitHub PR/issue/check status.
  - Produces daily triage summary and owner assignment.
- **QAAgent**:
  - Reads failed checks and validates release gates.
  - Flags flaky or missing smoke coverage.
- **BackendAgent**:
  - Reads Supabase schema and RLS state for diagnostics.
  - Produces data-path risk notes without mutation.
- **ComplianceAgent**:
  - Reads verification/dispute/payment evidence context.
  - Confirms Ireland-first policy continuity.

## 4) Pilot dry-run (Week 2 minimum)
Run at least two end-to-end examples:
1. GitHub-focused task:
   - Read failed check context -> propose remediation owner -> record report.
2. Supabase-focused task:
   - Read RLS/schema context -> propose safe fix plan -> record report.

## 5) Reporting format
Each daily report must include:
- status (`ok`, `blocked_missing_github_cli`, `error_collecting_metrics`)
- PR lead time median
- issue triage median
- ambiguous task ratio
- fallback reason (if any)
- read-only violation entry fields:
  - `timestamp`, `agent`, `mcp`, `attempted_action`, `blocked_reason`

## 6) Stop/Go rules (DR-006 aligned)
- **Stop and narrow scope** if:
  - fallback rate > 20%, or
  - guard false-positive rate > 10%, or
  - report generation fails 2 days in a row.
- **Go to phase 2 candidate** only if:
  - write violations = 0
  - measurable progress against pilot targets.

## 7) GitMCP + Magic usage rules
- GitMCP usage:
  - use GitMCP only for public-repo pilot context ingestion,
  - do not rely on GitMCP for private/sensitive repository access,
  - run `public-only checklist` before onboarding a repo.
- 21st.dev Magic usage:
  - use for UI ideation/prototyping only, not direct merge output,
  - generated code must be normalized into `components/ui/*` wrappers,
  - token-only prompt contract is optional (team can use raw Tailwind utilities when useful),
  - require manual review for accessibility, contrast, locale-safe links, and guardrail compliance.
- Minimum review gate for Magic-generated output:
  - token contract check passed,
  - no page-level style drift from shared system,
  - lint + unit/integration smoke checks passed before merge.
