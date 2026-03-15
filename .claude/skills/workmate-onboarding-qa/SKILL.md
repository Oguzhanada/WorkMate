---
name: workmate-onboarding-qa
description: Activate when debugging onboarding issues, verifying verified-ID behavior, testing admin document decisions, or preparing onboarding release checks.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# Provider Onboarding QA

## Where to Look

- Sign-up form: read `marketplace/components/auth/SignUpForm.tsx` for current implementation.
- Auth hooks: read `marketplace/components/auth/hooks/` directory for current hook implementations.
- Onboarding states: read `references/onboarding-states.md` for the state machine.
- Ireland doc rules: read `references/ireland-doc-rules.md` for compliance requirements.

## Workflow

1. Scope the scenario — capture user type, route, and expected state transition.
2. Map expected state transitions using `references/onboarding-states.md`. Verify no downgrade from approved ID to pending without new upload.
3. Run compliance and document checks using `references/ireland-doc-rules.md`.
4. Execute regression checklist using `references/regression-checklist.md`. Cover onboarding submit, admin document actions, approve/reject paths, and locale-safe navigation.
5. Report findings in order: Findings, Reproduction, Expected vs Actual, Fix Recommendation, Validation. Include absolute file paths.

## Resources

- `references/onboarding-states.md`, `references/ireland-doc-rules.md`, `references/regression-checklist.md`, `scripts/run_onboarding_smoke.ps1`

## Shared Rules

Follow `.claude/skills/references/workmate-shared-guardrails.md`.

## NEVER DO

- Never weaken auth or RLS requirements to bypass onboarding issues.
- Never allow non-English user-visible strings.
- Never violate Ireland-first product and legal assumptions.
- Never downgrade a verified identity status without a new document upload.
