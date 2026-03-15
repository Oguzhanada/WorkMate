---
name: workmate-payment-ops
description: Activate when implementing, debugging, or reviewing payment API routes, webhooks, Stripe Connect flows, or payout-related behavior.
metadata:
  severity: critical
  status: active
  synced_with: agents.md section 6
---

# Stripe Connect Payment Ops

## Workflow

1. **Identify payment stage.** Determine whether issue is in hold authorization, capture, refund, webhook, or dispute escalation. Confirm affected route and expected status transitions.

2. **Validate flow map.** Use `.claude/skills/workmate-payment-ops/references/flow-map.md`. Confirm secure hold uses manual capture semantics. Confirm webhook events map to idempotent state updates.

3. **Run operational checks.** Use `scripts/check_payment_surface.ps1`. Verify required routes/functions exist and naming remains stable.

4. **Apply controlled fix.** Preserve idempotency and replay safety. Keep user-facing text English-only.

5. **Final validation.** Use `.claude/skills/workmate-payment-ops/references/release-checklist.md`. Report: `Impact`, `Root Cause`, `Fix`, `Validation`, `Rollback`.

## Resilience Infrastructure (S42/S43)

- **Circuit breaker:** `lib/stripe/with-breaker.ts` — `executeStripeCall<T>()` wraps all Stripe API calls (failure threshold: 3, reset: 30s)
- **Idempotency:** `lib/idempotency/index.ts` — `checkIdempotency` + `saveIdempotencyResponse` (24h TTL) for all payment mutations
- **Audit trail:** `payment_events` table (migration 084) — AFTER UPDATE trigger on payments.status auto-inserts audit rows (migration 086)
- **Webhook encryption:** secrets encrypted at rest with AES-256-GCM via `lib/crypto/encrypt.ts` (FD-12)
- **Correlation ID:** all payment routes use `withRateLimit` wrapper for tracing

## Where to Look

- **Payment routes:** read `marketplace/app/api/connect/` and `marketplace/app/api/webhooks/stripe/` for current endpoints
- **Flow map:** `.claude/skills/workmate-payment-ops/references/flow-map.md`
- **Incident triage:** `.claude/skills/workmate-payment-ops/references/incident-triage.md`
- **Release checklist:** `.claude/skills/workmate-payment-ops/references/release-checklist.md`
- **Precheck script:** `scripts/check_payment_surface.ps1`
- **Incident template:** `.claude/skills/workmate-payment-ops/assets/incident-template.md`

## NEVER DO

- Never disable webhook signature verification in production code
- Never remove hold/capture state controls to force success
- Never destroy dispute or audit data trail
- Never bypass auth checks on payment endpoints
- Never skip idempotency checks on webhook handlers
- Never alter Ireland-first legal/compliance context in payment messaging

## Shared Rules

Also follow: `.claude/skills/references/workmate-shared-guardrails.md`
