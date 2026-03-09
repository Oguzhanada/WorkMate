# DR-006: MCP Read-Only Pilot (GitHub + Supabase)

- Date: 2026-03-09
- Status: Accepted
- Owners: WorkMate maintainers

## Decision
Run a 3-week MCP pilot focused on delivery speed while enforcing strict read-only access.

## Scope
- MCP runtime: local machine only.
- Included MCPs:
  - GitHub MCP (read-only)
  - Supabase MCP (read-only)
- Excluded from this pilot:
  - Stripe MCP
  - Vercel MCP
  - Figma MCP

## Security Contract
- Zero-tolerance write policy:
  - blocked actions include `insert`, `update`, `upsert`, `delete`, `create`, `alter`, `drop`, `grant`, `revoke`.
- Every blocked attempt must be logged with:
  - `timestamp`
  - `agent`
  - `mcp`
  - `attempted_action`
  - `blocked_reason`
- Phase-2 write capabilities are forbidden unless a new DR supersedes this one.

## Pilot Success Criteria (Go/No-Go)
- PR lead time improvement >= 20% versus baseline.
- Ambiguous task ratio reduction >= 30%.
- At least 5 agent tasks completed with MCP usage.
- Write violations = 0.

## Friction Threshold (automatic scope tightening)
- Daily MCP fallback rate > 20%, or
- Guard false-positive rate > 10%, or
- Daily report generation fails for 2 consecutive days.

If any threshold is breached:
- scope is narrowed,
- write mode remains disabled,
- remediation tasks are prioritized before expansion.
