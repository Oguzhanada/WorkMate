---
name: workmate-alerts-qa
description: Activate when validating task alert creation/matching permissions, debugging RLS policy regressions, or smoke-testing alert visibility constraints.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# Task Alerts RLS Smoke

## Where to Look

- Task alerts server actions: read `marketplace/app/actions/task-alerts.ts` for CRUD logic.
- Match function: read `marketplace/supabase/functions/match-task-alerts/index.ts` for edge function.
- Schema: `task_alerts` table created in `marketplace/migrations/036_airtasker_feature_layer.sql`.
- API route: `marketplace/app/api/task-alerts/` for GET/POST/DELETE.

## RLS Quick Audit

- Verify `task_alerts` RLS: customer can only see own alerts (`auth.uid() = user_id`).
- Verify provider cannot read other providers' alerts.
- Verify admin can read all via service role behind `ensureAdminRoute()`.

## Workflow

1. Validate `task_alerts` schema and RLS policies against migration 036.
2. Validate customer/provider visibility boundaries — no cross-user leakage.
3. Validate alert-match edge function trigger expectations.
4. Report policy gaps with least-privilege fixes.

## Resources

- `references/task-alerts-smoke-checklist.md`
- `scripts/run_task_alerts_precheck.ps1`

## Shared Rules

Follow `.claude/skills/references/workmate-shared-guardrails.md`.

## NEVER DO

- Never weaken RLS policies to fix alert visibility issues.
- Never allow cross-user alert data leakage in test or production.
