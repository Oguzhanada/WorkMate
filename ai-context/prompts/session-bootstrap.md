# AI Session Bootstrap — WorkMate

Use this file as the single entry point for any new AI session (Claude Code or Codex).

## Mandatory Read Order

Read these files before starting any task:

1. `ai-context/context/agents.md` — all rules, guardrails, and frozen decisions
2. `ai-context/context/PROJECT_CONTEXT.md` — current project state and architecture
3. `ai-context/decisions/index.md` — active decision record index

Then activate only the skills matching your task scope. Full skill activation matrix is in `agents.md` section 3.9.

## Task-Specific Reads

| Task type | Additional read required |
|-----------|--------------------------|
| DB / migration work | `docs/DB_RUNBOOK.md` |
| Launch / env / ops | `docs/PRODUCTION_LAUNCH.md` |
| Architecture health | `docs/ARCHITECTURE_REVIEW.md` |
| Env var reference | `docs/SECRETS_MAP.md` |

## Skill Safety Rules

- Do not force a skill if the task is out of scope.
- If multiple skills match, use the minimum valid set.
- If a skill is unavailable or unreadable, state it briefly and use a safe fallback.
- Do not carry skills from previous turns unless explicitly re-mentioned.

## First Response Contract

1. Confirm canonical files loaded.
2. Summarise current state in 5–10 bullets.
3. List top 3 priorities and top 3 risks.
4. State the exact skills selected (or fallback reason).
5. Propose the next concrete implementation step.

---

> All rules, guardrails, and frozen decisions are in `ai-context/context/agents.md`.
> Do not duplicate them here. If you see a rule in this file, it is stale — agents.md wins.
