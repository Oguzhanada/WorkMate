---
name: workmate-visual-qa
description: Visual QA workflow for WorkMate UI changes. Use when reviewing or shipping frontend updates to verify visual regression, interaction polish, and performance gates via Backstop and Lighthouse, and to prepare merge-blocking evidence for PRs.
---

# WorkMate Visual QA

## Workflow

1. Scope review
- Identify touched user-facing pages/components.
- Prioritize high-traffic flows (home, jobs, post-job, profile, dashboard, providers).

2. Visual regression
- Run Backstop reference/test process for affected views.
- Compare diffs and classify as expected or regression.

3. UX quality checks
- Verify spacing rhythm, typography hierarchy, hover/focus/pressed states, and empty/loading states.
- Verify mobile and desktop parity.
- Verify dark mode parity on touched views.

4. Performance/quality gate
- Run Lighthouse CI and review score regressions.
- Treat Backstop/Lighthouse failures as blocking.

5. Release evidence
- Attach artifact links/screenshots in PR notes.
- List approved intentional visual changes to avoid review ambiguity.

## Required Gates

- Backstop visual regression: pass
- Lighthouse CI: pass
- Lint + tests: pass
