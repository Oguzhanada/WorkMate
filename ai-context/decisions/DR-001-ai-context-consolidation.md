# DR-001: AI Context Consolidation to `ai-context/`

- Date: 2026-03-08
- Status: Accepted
- Owners: WorkMate maintainers

## Decision
Consolidate all canonical AI context into `ai-context/` with this structure:
- `context/`
- `memory/`
- `prompts/`
- `decisions/`

Keep `.claude/skills` in place for tool compatibility.
Keep `marketplace/AGENTS.md` as a lightweight shim pointer.

## Rationale
- Root-level AI files were fragmented and hard to maintain.
- A single canonical location reduces context drift and onboarding ambiguity.
- Separating product docs (`docs/`) from AI memory reduces operational noise.

## Consequences
- Prompt/bootstrap/read-order references must use `ai-context/...` paths.
- Historical AI notes are now under `ai-context/memory/checkpoints/`.
- Any future context files should be added under `ai-context/` only.
