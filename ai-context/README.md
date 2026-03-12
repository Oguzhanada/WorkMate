# AI Context Directory (`ai-context/`)

Canonical location for WorkMate AI context.

## Canonical Files (read in this order)

1. `ai-context/context/agents.md` — **single source of truth** for rules, guardrails, frozen decisions
2. `ai-context/context/PROJECT_CONTEXT.md` — current project state, architecture, env
3. `ai-context/decisions/index.md` — active decision record index

Entry point for new sessions: `ai-context/prompts/session-bootstrap.md`

## Directory Layout

| Path | Purpose |
|------|---------|
| `context/agents.md` | Canonical rules (this wins all conflicts) |
| `context/PROJECT_CONTEXT.md` | Project state snapshot |
| `decisions/index.md` | DR index |
| `decisions/DR-*.md` | Individual decision records |
| `prompts/session-bootstrap.md` | Session entry point — reads only, no rules |
| `prompts/claude-guidelines.md` | **Deprecated stub** — do not read for rules |
| `context/compliance-rules.md` | **Deprecated stub** — do not read for rules |
| `memory/checkpoints/` | Historical session checkpoints — read-only reference, never rules |
| `memory/daily/` | Day-level notes |

## Deprecated / Deleted Files

| File | Status | Canonical replacement |
|------|--------|-----------------------|
| `ai-context/prompts/claude-guidelines.md` | Deprecated stub (still present, content replaced with pointer) | `ai-context/context/agents.md` |
| `ai-context/context/compliance-rules.md` | Deprecated stub (still present, content replaced with pointer) | `ai-context/context/agents.md` section 2 |
| `docs/PROJECT_GUIDE.md` | **Deleted** (S39 consolidation) | `ai-context/context/agents.md` + `PROJECT_CONTEXT.md` |
| `docs/strategy/*` | **Deleted** (S39 consolidation) | Not needed for development |

## Reference Update Policy

- Use `rg` to find stale path references before and after edits.
- Update active sources to point to `ai-context/context/agents.md`.
- Do not bulk-rewrite historical archive documents.
