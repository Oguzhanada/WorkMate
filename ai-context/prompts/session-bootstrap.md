# AI Session Bootstrap (WorkMate)

Use this file as the single entry point for any new AI session (Codex or Claude).

## Session Opener (one line)
`Please read ai-context/context/PROJECT_CONTEXT.md + ai-context/context/agents.md + ai-context/context/compliance-rules.md + the current skills list (Codex: ~/.codex/skills, "<repo>/.claude/skills"; Claude: .claude/skills), choose only scope-matching skills, and if a skill mismatches, warn briefly and continue with the safest fallback.`

## Mandatory Read Order
1. `ai-context/context/PROJECT_CONTEXT.md`
2. `ai-context/context/agents.md`
3. `ai-context/context/compliance-rules.md`
4. `~/.claude/projects/<project-slug>/memory/MEMORY.md`
5. `.claude/skills/workmate-core/SKILL.md`
6. `.claude/skills/workmate-schema-guardian/SKILL.md`
7. `marketplace/lib/auth/rbac.ts`
8. `marketplace/lib/dashboard/widgets.ts`
9. `marketplace/lib/i18n/locale-path.ts`
10. `marketplace/lib/validation/api.ts`

## Skill Paths
- Codex shared skills: `~/.codex/skills/`
- Project skills (Claude): `.claude/skills/`

## Skill Safety Rules
- Do not force a skill if the task is out of scope.
- If multiple skills match, use the minimum valid set.
- If a skill is unavailable or unreadable, state it briefly and use a safe fallback.
- Do not carry skills from previous turns unless explicitly re-mentioned.

## Non-Negotiable Guardrails
- English-only project artifacts.
- Ireland-first compliance and terminology.
- Respect frozen decisions in `ai-context/context/agents.md` (Rule 19).
- No architecture changes that violate frozen decisions without a Decision Record.
- Use context-appropriate Supabase clients only (`client/server/route/service` split).
- No hardcoded `/en/` routes; use locale helpers.
- Money in integer EUR cents only.

## First Response Contract (what AI must return first)
1. Confirm files/skills loaded.
2. Summarize current state in 5-10 bullets.
3. List top 3 priorities and top 3 risks.
4. State the exact skills selected (or fallback reason).
5. Propose the next concrete implementation step.
