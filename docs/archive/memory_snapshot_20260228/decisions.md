---
VERSION: 1.0
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Decision log initialized
- Seeded with core product and architecture decisions
- Added Stripe Identity verification direction and ID-storage minimization policy
---

# Decision Log

## 2026-02-28 - Identity Verification Provider and Storage Policy

- Decision: Use Stripe Identity as the primary ID verification method.
- Decision: For Stripe-verified users, do not store raw ID document files in WorkMate storage by default.
- Reason: Faster onboarding flow, lower sensitive data footprint, and reduced operational review overhead.
- Constraints: Keep audit-safe verification metadata only; confirm legal/compliance retention obligations before deleting any legacy IDs.
- Alternatives:
  - Keep admin manual ID review for every user (rejected: slower and higher ops load).
  - Keep full ID-file storage after Stripe verification (rejected: unnecessary data exposure for default flow).

## 2026-02-27 - Identity and Provider Verification Handling

- Decision: Preserve approved ID state during provider onboarding updates.
- Reason: Prevent trust-state regression and redundant document requests.
- Alternatives: Always reset to pending on onboarding submit (rejected due to UX and operational overhead).

## 2026-02-27 - Admin Document Access Mode

- Decision: Provide both signed open URL and signed download URL in admin document APIs.
- Reason: Support fast in-browser review and explicit file download in one flow.
- Alternatives: Open-only links (rejected due to poor review operations).

## 2026-02-26 - Payments Strategy

- Decision: Stripe Connect with secure hold and delayed capture.
- Reason: Fits marketplace flow and dispute window requirements.
- Alternatives: Immediate capture flow (rejected due to weaker completion/dispute control).

## 2026-02-26 - Data Access Security Model

- Decision: Keep strict RLS as default and avoid broad permissive policies.
- Reason: Multi-role marketplace with sensitive identity/payment data.
- Alternatives: Service-role-heavy route patterns without strict RLS (rejected for higher misuse risk).

## 2026-03-05 - Premium Minimal UI Direction (Global Theme)

- Decision: Standardize WorkMate UI on an Apple-level premium minimal design language across core pages.
- Decision: Use a shared global visual system (soft surfaces, generous spacing, restrained accent usage, dark-mode parity) and apply it consistently to dashboard and surrounding flows.
- Decision: Prioritize one primary action per screen and convert secondary actions to outline/ghost styles for clear hierarchy.
- Reason: Reduce visual noise, improve scanability, and increase perceived product quality while preserving existing business functionality.
- Constraints: Preserve Ireland-first and English-only guardrails, keep existing API/data behavior unchanged, and avoid regressions in onboarding/payment/dashboard flows.
- Alternatives:
  - Keep per-page ad-hoc styling (rejected: inconsistent UX and lower perceived quality).
  - Heavy decorative redesign with dense gradients/motion (rejected: conflicts with minimal clarity goal).
