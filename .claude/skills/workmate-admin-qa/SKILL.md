---
name: workmate-admin-qa
description: Activate when verifying admin dashboard panel changes, investigating admin regressions, or QA-testing document open/download, decision actions, or bulk operations.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# Admin Dashboard Live QA

## Where to Look

- Admin panel: read `marketplace/components/dashboard/AdminApplicationsPanel.tsx` for current implementation.
- Admin hooks: read `marketplace/components/dashboard/hooks/` directory (useApplicationsData, useApplicationFilters, useApplicationActions, useApplicationStats).
- Admin styling: read `marketplace/app/tokens.css` for `--wm-admin-*` tokens.
- Admin routes (18 total): `marketplace/app/api/admin/` — analytics, api-keys, audit-logs, automation-rules, compliance, feature-flags, gdpr, grant-monthly-credits, jobs, pending-jobs, provider-applications, risk, sla-check, stats, update-loyalty-levels, verification, verification-queue, webhook-events.

## Workflow

1. Validate data load and tabs — confirm all 18 admin routes respond correctly.
2. Validate document actions for PDF/JPG/PNG — open, download, preview.
3. Validate per-row and bulk decision actions (approve/reject/request-resubmission).
4. Validate locale-safe routing from table and detail actions (FD-11).
5. Report findings by severity with route and file references.

## Resources

- `references/admin-qa-checklist.md`
- `scripts/run_admin_dashboard_precheck.ps1`

## Shared Rules

Follow `.claude/skills/references/workmate-shared-guardrails.md`.

## NEVER DO

- Never hardcode colors; use design tokens from `marketplace/app/tokens.css`.
- Never bypass RLS policies to fix admin display issues.
- Never remove locale prefixes from admin routes.
