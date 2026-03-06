---
VERSION: 1.0
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Initial prioritized next-step plan created
- Aligned with active tasks in context and codebase
- Added Stripe Identity-first implementation and legacy-ID cleanup tasks
---

# Next Steps

## Priority Queue

1. Apply and verify migration `047_time_tracking_and_invoicing.sql` across all environments.
2. Add automated tests for time-entry permissions and invoice edge cases (no approved entries, duplicate invoice attempt).
3. Add webhook delivery observability (attempt logs + failure dashboard) for public webhook reliability.
4. Implement API key scopes (read-only vs write-capable) and rotate-key audit trail.
5. Implement Stripe Identity-first onboarding/profile verification flow (customer + provider UX paths).
6. Define and apply legacy ID-file cleanup strategy for Stripe-verified users (after compliance confirmation).
7. Validate provider onboarding end-to-end with verified-ID and non-verified-ID scenarios.
8. Run focused RLS smoke tests for `task_alerts` and admin visibility assumptions.
9. Complete admin decision UX hardening:
   - Confirm inline modal note flows.
   - Verify action locking/loading in concurrent interactions.
10. Integrate task alert visibility and controls into provider dashboard UI.
11. Surface ranking score signals in customer quote selection views.
12. Deploy/verify `match-task-alerts` function with production secret policy.
13. Add monitoring for `provider_rankings` refresh and expired quote jobs.
14. Expand automated coverage for onboarding, admin review, and ranking regressions.

## UI Architecture Follow-up

11. Migrate auth pages (`/[locale]/login`, `/[locale]/sign-up`) to shared `Shell` and shared button hierarchy.
12. Migrate profile pages to shared cards/badges and remove duplicated module-level visual variants.
13. Migrate admin dashboard visual layer to shared primitives while preserving existing decision workflows.
14. Add visual regression snapshots for shared-theme pages to detect style drift.

## Documentation Process Next

- Daily: append updates to `08_checkpoints.md` and revise this file.
- Weekly or major merge: reconcile all memory docs against `marketplace/` source.
