---
paths:
  - "marketplace/app/api/payments/**/*.ts"
  - "marketplace/app/api/webhooks/**/*.ts"
  - "marketplace/lib/stripe/**/*.ts"
  - "marketplace/lib/crypto/**/*.ts"
---

# Payment Route Standards

- Money: `*_amount_cents`, EUR, integer only (FD-09)
- Webhooks: HTTPS + HMAC-SHA256 + AES-256-GCM encrypted secrets (FD-12)
- Circuit breaker: `lib/stripe/with-breaker.ts` for all Stripe API calls
- Idempotency: `lib/idempotency/` for all payment mutations
- Audit trail: `payment_events` table (migration 084)
- Tests required: happy path, validation, auth, edge case (FD-32)
- Error responses: `lib/api/error-response.ts` helpers only (FD-27)
- Supabase: `getSupabaseRouteClient()` per-request, never module-scope (FD-08)
- Canonical source: `ai-context/context/agents.md` section 6
