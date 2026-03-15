---
name: workmate-production-launch
description: Use when preparing for go-live, verifying production readiness, activating live services (Stripe, Resend, Supabase), or checking env vars.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# WorkMate Production Launch

Source of truth: `docs/PRODUCTION_LAUNCH.md` — read that file directly for the authoritative checklist.

## Where to Look

- Launch checklist: `docs/PRODUCTION_LAUNCH.md`
- Env var reference: `docs/PRODUCTION_LAUNCH.md`
- Migrations: `marketplace/migrations/`
- Edge functions: `marketplace/supabase/functions/`
- Shared guardrails: `.claude/skills/references/workmate-shared-guardrails.md`

## Procedure

### Phase 1 — Technical Verification

Run in test environment first. All must pass before spending money.

```bash
cd marketplace
npm run test:unit && npm run test:e2e:smoke && npm run lint && npm run build
```

Verify manual happy-path flows:
- Customer + provider sign-up (email + Google OAuth, Eircode validation)
- Job posting (`get_quotes` and `quick_hire`), quote submit, accept
- Stripe secure hold, capture, time tracking, invoice, payment
- Provider availability + appointment booking
- Admin: job approval, document review, API key management
- Task alerts, dashboard widgets, email notifications via Resend

Verify Supabase dev:
- Verify all migrations in `marketplace/migrations/` are applied.
- Confirm RLS on all tables — no `FOR ALL USING (true)` policies.
- Confirm `pg_cron` jobs registered: `provider_rankings`, `automation_rules`.
- Confirm edge functions deployed.

### Phase 2 — Account & Service Setup

1. **Resend** — create account, generate prod API key, add domain `workmate.ie`, verify DNS (SPF, DKIM, DMARC), test real send.
2. **Supabase Production** — create separate project (not dev). Apply all migrations. Enable `pg_cron`. Configure Auth (site URL, redirects, email confirm, SMTP). Deploy edge functions.
3. **Stripe Live** — complete Connect platform setup. Switch to live keys. Create webhook endpoint at `https://workmate.ie/api/webhooks/stripe`. Enable Stripe Identity.
4. **Vercel** — import repo, set root directory `marketplace/`, add all production env vars, configure domain `workmate.ie`.

### Phase 3 — Business & Legal

Register company (Ireland). Register domain `workmate.ie`. Publish Privacy Policy, Terms of Service, Cookie Policy. Implement GDPR consent banner. Configure Stripe Ireland tax.

### Phase 4 — Go-Live Switch

Env var checklist: read `docs/PRODUCTION_LAUNCH.md` for the canonical list. Critical vars: `NEXT_PUBLIC_SUPABASE_URL`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `WEBHOOK_SECRET_ENCRYPTION_KEY`.

Go-live steps:
1. Verify all env vars set in Vercel, redeploy.
2. Run Phase 1 manual flows against production URL.
3. Make one real test payment with a real card. Stripe test cards: see Stripe documentation.
4. Verify Resend delivers real email.
5. Flip Stripe Connect to live mode.

### Phase 5 — Post-Launch Monitoring

Monitor Supabase (CPU, connections, storage), Stripe (success rate, failed webhooks), Vercel (Core Web Vitals, errors), Resend (delivery, bounces). Set up Supabase alerts. Monitor `pg_cron` health weekly.

## Risk Flags

- **Never use dev Supabase project in production** — data isolation required.
- **Never commit `.env.local`** — use Vercel env var UI.
- **Stripe webhook secret must match** — mismatch silently drops events.
- **`pg_cron` must be enabled manually** on each new Supabase project.

## NEVER DO

- Never skip Phase 1 verification before spending money on services.
- Never reuse dev Supabase credentials in production.
- Never hardcode secrets in source code.
