# DR-013 — Critical Route Test Coverage Mandatory

| Field | Value |
|-------|-------|
| **ID** | DR-013 |
| **Date** | 2026-03-14 |
| **Author** | Independent Audit + Ada |
| **Decision** | New FD-32 — payment, webhook, and idempotency routes must have unit tests |
| **Status** | Accepted |
| **Trigger** | Independent audit 2026-03-14 flagged 29 test files for 116 routes as High risk |

## Context

The audit found that critical business logic (payment capture, webhook retry, idempotency checks) has no route-level unit tests. The existing 29 test files are primarily contract tests and integration tests. A regression in payment capture or webhook processing could go undetected until production.

## Decision

1. **All routes in these categories MUST have co-located or dedicated test files:**
   - `app/api/payments/**` — payment hold, capture, refund
   - `app/api/webhooks/**` — Stripe webhook, internal webhook delivery
   - `app/api/stripe/**` — Stripe Connect operations
   - Any route using `checkIdempotency` / `saveIdempotencyResponse`
2. Tests must cover: happy path, validation failure, auth failure, and at least one edge case.
3. New routes in these categories cannot be merged without tests.
4. Existing routes should be covered incrementally — target 30 new tests.

## Consequences

- Higher confidence in payment flow correctness.
- Slower initial development for payment routes (test writing overhead).
- CI `npm run test` becomes a meaningful safety gate.

## Frozen Decision

**FD-32**: Payment, webhook, Stripe, and idempotent routes MUST have unit tests covering happy path, validation, auth, and one edge case. No merge without tests for these categories.
