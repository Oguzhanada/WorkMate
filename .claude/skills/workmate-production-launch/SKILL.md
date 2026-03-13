---
name: workmate-production-launch
description: Step-by-step production launch workflow for WorkMate. Use when preparing for go-live, verifying production readiness, activating live services (Stripe, Resend, Supabase), or checking env vars. Covers all 5 launch phases from docs/PRODUCTION_LAUNCH.md.
metadata:
  severity: standard
  last_synced: 2026-03-13
---

# WorkMate Production Launch

Source of truth: `docs/PRODUCTION_LAUNCH.md`

## Phase Overview

```
Phase 1 → Technical verification   (test env, no cost)
Phase 2 → Account & service setup  (Resend, Supabase prod, Stripe live, Vercel)
Phase 3 → Business & legal setup   (company, domain workmate.ie, GDPR)
Phase 4 → Go-live switch           (flip test → production)
Phase 5 → Post-launch monitoring   (ongoing)
```

## Phase 1 — Technical Verification

Run in test environment first. All must pass before spending money.

### Automated checks
```bash
cd marketplace
npm run test:unit          # all unit tests green
npm run test:e2e:smoke     # smoke tests green (Chromium only)
npm run lint               # 0 TS errors + English-only check passes
npm run build              # production build succeeds
```

### Manual happy-path flows to verify
- Customer sign-up (email + Google OAuth)
- Provider sign-up + Eircode validation
- ID verification (Stripe Identity test mode)
- Job posting: both `get_quotes` and `quick_hire` modes
- Quote submit → ranking badge visible → quote accepted
- Stripe secure hold → capture (test card `4242 4242 4242 4242`)
- Time tracking: start/stop → customer approves → Stripe invoice → paid
- Provider availability slots → appointment booking
- Admin: job approval, document review, API key management
- Task alerts: create → job posted → matched → notification
- Dashboard widgets: add/remove/reorder via drag-drop
- Email notifications: check Resend test logs (quote_received, quote_accepted, payment_released)

### Supabase dev checks
- All migrations 001–081 applied, no errors
- RLS on all tables — no `FOR ALL USING (true)` policies
- `pg_cron` jobs registered: `provider_rankings`, `automation_rules`
- Edge functions deployed: `match-task-alerts`, `auto-release-payments`, `escalate-stale-disputes`, `id-verification-retention`

## Phase 2 — Account & Service Setup

### Resend
1. Create account at resend.com → generate prod API key → `RESEND_API_KEY`
2. Add domain `workmate.ie` → verify DNS (SPF, DKIM, DMARC via Cloudflare)
3. Test real send before go-live

### Supabase Production (NEW project — not dev)
1. Create separate Supabase project for production
2. Apply ALL migrations 001–081 in SQL Editor
3. Enable `pg_cron` extension
4. Auth → Site URL: `https://workmate.ie`
5. Auth → Redirect URLs: `https://workmate.ie/auth/callback`
6. Auth → Email Confirm: ON
7. Configure Auth SMTP: `smtp.resend.com:465`, username `resend`, password = RESEND_API_KEY
8. Deploy Edge Functions to production project

### Stripe (Live Mode)
1. Complete Stripe Connect platform account setup (business details)
2. Switch to live mode → generate live keys → `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
3. Create Stripe Connect webhook → endpoint: `https://workmate.ie/api/webhooks/stripe`
4. Events: `payment_intent.*`, `account.updated`, `invoice.paid`, `invoice.payment_succeeded`
5. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`
6. Enable Stripe Identity for live verification

### Vercel
1. Import WorkMate repo to Vercel
2. Set root directory: `marketplace/`
3. Add all production env vars (see env var checklist below)
4. Configure custom domain: `workmate.ie`

## Phase 3 — Business & Legal

- Company registration (Ireland) or sole trader
- Domain `workmate.ie` registered + DNS to Vercel
- Privacy Policy, Terms of Service, Cookie Policy pages live
- GDPR: data processing agreement, cookie consent banner working
- Stripe Ireland tax configuration

## Phase 4 — Go-Live Switch

**Pre-flight env var checklist:**

```env
# Supabase (PRODUCTION values)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (LIVE keys — NOT test)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://workmate.ie
WEBHOOK_HMAC_SECRET=        # generate: openssl rand -hex 32
```

**Go-live steps:**
1. Verify all env vars set in Vercel → redeploy
2. Run Phase 1 manual flows against production URL
3. Make one real €1 test payment with a real card
4. Verify Resend delivers real email
5. Flip Stripe Connect to live mode

## Phase 5 — Post-Launch Monitoring

- Supabase dashboard: DB CPU, connections, storage
- Stripe dashboard: payment success rate, failed webhooks
- Vercel analytics: Core Web Vitals, error rate
- Resend: delivery rate, bounces
- Set up Supabase alerts for DB errors
- Monitor `pg_cron` job health weekly

## Risk Flags

- **Never use dev Supabase project in production** — data isolation required
- **Never commit `.env.local`** — use Vercel env var UI
- **Stripe webhook secret must match** — mismatch silently drops events
- **pg_cron must be enabled manually** on each new Supabase project
