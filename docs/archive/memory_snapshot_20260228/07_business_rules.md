---
VERSION: 1.0
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Initial business rules baseline recorded
- Added role, verification, and compliance-sensitive rules
---

# Business Rules

## Language and Jurisdiction

- English-only content across UI and documentation.
- Ireland-first product and compliance posture.

## Identity and Verification

- ID verification state is tracked separately and drives trust behavior.
- Onboarding flow preserves approved ID state and avoids unnecessary downgrade.
- Provider approval requires required documents to be verified (ID + insurance baseline).

## Role and Access

- Role model: `customer`, `verified_pro`, `admin`.
- Posting jobs requires customer capability.
- Quoting requires provider capability; tier/verification rules can further restrict access.
- Admin routes are gated and audited.

## Quote and Lead Controls

- Quotes have expiration metadata and ranking score support.
- Basic-tier provider restrictions are enforced for access scope and daily limits.
- Task alert matching can notify providers when a job matches configured filters.

## Payment and Disputes

- Stripe Connect secure hold model with delayed capture.
- Dispute lifecycle includes evidence, response, resolution, and payment action paths.

## Validation Rules

- Zod schemas enforce API contracts.
- Irish data quality checks include Eircode and phone validation.

