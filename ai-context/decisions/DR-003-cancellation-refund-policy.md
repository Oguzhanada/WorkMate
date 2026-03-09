# DR-003: Cancellation and Refund Policy Contract

- Date: 2026-03-09
- Status: Accepted
- Owners: WorkMate maintainers

## Decision
Adopt one platform-wide cancellation and refund policy for customer, provider, support, and admin flows.

### Policy contract
- Before quote acceptance: `0%` platform deduction, full refund.
- After acceptance and before `in_progress`: `15%` platform deduction, remaining amount refunded.
- After `in_progress`: no automatic full refund; dispute flow and evidence review are mandatory.

### Dispute and release contract
- Payment release states are limited to:
  - `manual_release`
  - `automation_release`
  - `dispute_hold`
- Any post-`in_progress` refund decision must reference dispute evidence and admin resolution notes.

### UI contract
- Policy copy must be visible where users decide risk:
  - accept quote
  - cancellation action
  - dispute action
- Trust copy includes a happiness pledge variant:
  - "If you're not satisfied, request a review within 7 days."

## Rationale
- Removes inconsistent ad-hoc decisions in support/admin operations.
- Aligns customer expectations with provider payout certainty.
- Reduces repeat friction around "what happens if we cancel now?"

## Consequences
- All cancellation and refund logic must align with this policy contract.
- Any policy change requires a new Decision Record and migration-safe rollout notes.
