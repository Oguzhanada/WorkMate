---
name: workmate-visual-qa
description: Visual QA workflow for WorkMate UI changes. Use when reviewing or shipping frontend updates to verify interaction polish, performance gates via Lighthouse, and to prepare quality evidence for PRs.
metadata:
  severity: standard
  last_synced: 2026-03-13
  synced_with: FD-03, FD-14, DR-007
---

# WorkMate Visual QA

## Workflow

1. Scope review
- Identify touched user-facing pages/components.
- Prioritize high-traffic flows (home, jobs, post-job, profile, dashboard, providers).

2. UX quality checks
- Verify spacing rhythm, typography hierarchy, hover/focus/pressed states, and empty/loading states.
- Verify mobile and desktop parity.
- Verify dark mode parity on touched views.
- Confirm all `--wm-*` design tokens used correctly (no hardcoded hex).

3. Performance/quality gate
- Run Lighthouse CI (nightly workflow) and review score regressions.
- Treat Lighthouse regressions as actionable (not merge-blocking, but tracked).

4. Release evidence
- Attach artifact links/screenshots in PR notes.
- List approved intentional visual changes to avoid review ambiguity.

## Required Gates

- Lighthouse CI: nightly performance gate (`.github/workflows/lighthouse.yml`)
- Lint + tests: pass
