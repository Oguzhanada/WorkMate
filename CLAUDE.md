# WorkMate — Claude Code

For full project context, read in this order:

1. `ai-context/context/agents.md` — all rules, guardrails, and frozen decisions (FD-01–FD-28). This is the conflict-resolution authority.
2. `ai-context/context/PROJECT_CONTEXT.md` — current project state, architecture, and env
3. `ai-context/decisions/index.md` — active decision records

For task-specific reads, see `ai-context/prompts/session-bootstrap.md`.

## Migration chain

Before creating any new migration, inspect `marketplace/migrations/` to confirm the current highest number. Never trust a stale reference in documentation.

## Skill activation

Activate `workmate-core` at the start of every session. For task-specific skills, see `ai-context/context/agents.md` section 3.9.
