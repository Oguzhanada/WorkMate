# Incident Triage (Payments)

## Severity quick guide

- High: funds movement incorrect, irreversible capture/refund risks
- Medium: delayed status sync, webhook retries, dashboard inconsistency
- Low: non-blocking UI mismatch or messaging issue

## Triage steps

1. Collect identifiers: job id, payment intent id, quote id, user id
2. Confirm current state in DB + Stripe dashboard
3. Check webhook delivery log and signature verification status
4. Verify idempotency keys / duplicate processing protection
5. Apply minimal safe patch and rerun flow

## Never-do actions

- Force-mark success without Stripe confirmation
- Skip webhook verification
- Remove dispute/audit records
