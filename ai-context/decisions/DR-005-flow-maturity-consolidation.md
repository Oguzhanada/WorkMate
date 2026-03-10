# DR-005: Flow Maturity Consolidation Under One State Contract

- Date: 2026-03-09
- Status: Accepted
- Owners: WorkMate maintainers

## Decision
Consolidate customer, provider, and admin flows under one shared state contract and operational vocabulary.

## Shared state contract
- Job states: `open -> quoted -> accepted -> in_progress -> completed`
- Payment resolution branch:
  - `released` (manual or automation)
  - `disputed`
  - `cancelled` (policy-gated)

## Operational visibility contract
- Admin ops views must expose:
  - `payment_failed`
  - `chargeback`
  - `verification_rejection`
  - escalation ownership and retry status
- Telemetry baseline is intentionally light and production-oriented:
  - funnel drop-off checkpoints
  - dispute lifecycle markers
  - payment failure markers

## Rationale
- Existing capabilities already exist across multiple modules; the gap is orchestration.
- A unified contract prevents drift between product UX, policy handling, and support actions.

## Consequences
- New flow work must map to this contract first, then implementation details.
- Dashboard and incident views are release-critical for operational readiness.
