# WorkMate Stripe Connect Flow Map

## Core lifecycle

1. Customer accepts quote -> create secure hold (`capture_method=manual`)
2. PaymentIntent authorized, not captured
3. Job completion/dispute resolution -> capture or refund
4. Stripe webhook events update internal payment state

## Key expectations

- Hold creation and capture paths must be idempotent
- Webhook handlers must verify signature and tolerate retries
- Payment state changes must remain auditable

## Typical failure clusters

- Webhook signature mismatch
- Duplicate webhook delivery causing state churn
- Capture attempted on uncaptured/expired intents
- Refund logic running before hold/capture reconciliation
