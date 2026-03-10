# DR-004: Provider Funnel Standardization

- Date: 2026-03-09
- Status: Accepted
- Owners: WorkMate maintainers

## Decision
Standardize provider lifecycle into one explicit journey:

`discover -> quote -> accepted -> in_progress -> completed -> paid`

## Scope
- Provider onboarding gates:
  - identity/verification eligibility
  - profile completeness
  - first quote submission milestone
- First quote milestone must trigger:
  - provider welcome email with dashboard tour entry point
  - dashboard tour hint (`tour=1`) for initial workspace orientation

## Quote SLA rule (phase-bound)
- In this phase, SLA is visibility-only and opt-in.
- SLA enforcement (ranking/penalty) is explicitly deferred to the next phase.

## Rationale
- Funnel clarity is the primary supply-side bottleneck.
- Ambiguous transitions create provider drop-off and support burden.
- A single state story allows measurable activation and conversion metrics.

## Consequences
- Product copy, metrics, and widgets must reference the same state model.
- Future SLA penalties cannot be shipped without explicit DR update and provider comms.
