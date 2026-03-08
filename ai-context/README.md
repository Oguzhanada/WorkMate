# AI Context Directory (`ai-context/`)

This is the canonical location for WorkMate AI context.

## Canonical Read Order
1. `ai-context/context/PROJECT_CONTEXT.md`
2. `ai-context/context/agents.md`
3. `ai-context/context/compliance-rules.md`
4. `ai-context/prompts/session-bootstrap.md`
5. `.claude/skills/*` (tool/runtime skills)

## Directory Layout
- `context/`: stable project context and guardrails
- `memory/checkpoints/`: session checkpoints and archived memory snapshots
- `memory/daily/`: day-level notes (`YYYY-MM-DD.md`)
- `prompts/`: reusable prompt templates and bootstrap guides
- `decisions/`: decision records (`DR-XXX`)

## Migration Notes

| Old path | New path |
|---|---|
| `PROJECT_CONTEXT.md` | `ai-context/context/PROJECT_CONTEXT.md` |
| `.agents.md` | `ai-context/context/agents.md` |
| `AI_SESSION_BOOTSTRAP.md` | `ai-context/prompts/session-bootstrap.md` |
| `CLAUDE.md` | `ai-context/prompts/claude-guidelines.md` |
| `CLAUDE_PROMPT_CUSTOMER_DASHBOARD.md` | `ai-context/prompts/customer-dashboard-prompt.md` |
| `docs/CHECKPOINT_SESSION*.md` | `ai-context/memory/checkpoints/CHECKPOINT_SESSION*.md` |
| `docs/archive/memory_snapshot_20260228/*.md` | `ai-context/memory/checkpoints/memory_snapshot_20260228__*.md` |

## Reference Update Policy
- Use `rg` to find stale path references before and after edits.
- Update active sources to `ai-context/...` paths.
- Do not bulk-rewrite historical archive documents unless explicitly requested.
