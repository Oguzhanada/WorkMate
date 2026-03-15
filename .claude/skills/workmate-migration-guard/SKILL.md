---
name: workmate-migration-guard
description: Use when creating, reviewing, or debugging Supabase SQL migrations, RLS policies, indexes, constraints, or schema changes in WorkMate.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# Supabase Migration Guardian

## Where to Look

- Migrations: `marketplace/migrations/`
- Guardrails and anti-patterns: `references/workmate-supabase-guardrails.md`
- Static checks: `scripts/check_migration_guardrails.ps1`
- Shared guardrails: `.claude/skills/references/workmate-shared-guardrails.md`

## Procedure

1. **Identify scope.** Confirm target tables, affected endpoints, and expected runtime behavior. Confirm whether change impacts auth, onboarding, payments, disputes, or admin actions.

2. **Draft migration.** Add a new numbered file in `marketplace/migrations/`. Migration count: inspect `marketplace/migrations/` for the highest-numbered file before creating a new migration. Prefer additive changes first (`ADD COLUMN`, new indexes, new policies), then controlled backfills. Avoid destructive changes unless explicitly requested.

3. **Run guardrail script.** Execute via `powershell.exe -File scripts/check_migration_guardrails.ps1 -MigrationPath <path-or-folder>` (Claude Code shell is bash on Windows). Fix all blocking issues before continuing.

4. **Verify behavior.** Confirm impacted API routes and server actions satisfy expected access control. Confirm Ireland-first assumptions are preserved (counties, Eircode, document flows). Confirm English-only user-facing content for errors/messages added in app code.

5. **Final review pass.** Confirm no policy includes `FOR ALL USING (true)`. Confirm no table disables RLS unless explicitly approved. Confirm migration file naming and ordering is consistent.

## Output Style

Report `Risks`, `Changes`, and `Validation` in that order. Include exact file paths and SQL snippets to patch. If a requested migration is unsafe, provide a safer alternative and explain why.

## NEVER DO

- Never create a migration with `FOR ALL USING (true)`.
- Never disable RLS on a table without explicit approval.
- Never skip the guardrail script before submitting a migration.
