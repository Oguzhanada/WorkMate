> **Scope note:** This document covers production launch operations only. It is not a source of truth for AI rules or frozen decisions.
> Canonical AI sources: `ai-context/context/agents.md` · `ai-context/context/PROJECT_CONTEXT.md` · `ai-context/decisions/index.md`

# WorkMate — Production Launch Guide
> Last updated: 2026-03-11 (session 38)
> This file is the single source of truth for everything that must be done before
> and during production launch. Update it as steps are completed.

---

## Overview — Launch Phases

```
Phase 1 → Technical verification  (no cost, do in dev/staging first)
Phase 2 → Account & service setup (accounts, API keys — low cost)
Phase 3 → Business & legal setup  (company, domain, GDPR — real cost + time)
Phase 4 → Go-live switch          (flip from test to production)
Phase 5 → Post-launch monitoring  (ongoing)
```

---

## Phase 1 — Technical Verification (Test Environment)

Verify the full happy-path before spending any money.

### Core flows to test manually
- [ ] Customer sign-up (email + Google OAuth)
- [ ] Provider sign-up + Eircode validation
- [ ] ID verification via Stripe Identity (test mode)
- [ ] Job posting (both `get_quotes` and `quick_hire` modes)
- [ ] Quote submission (provider) → ranking badge visible on customer dashboard
- [ ] Quote acceptance (customer)
- [ ] Stripe secure hold → payment capture (test card `4242 4242 4242 4242`)
- [ ] Time tracking: provider starts/stops timer → customer approves → Stripe invoice created → paid
- [ ] Provider availability slots → customer appointment booking
- [ ] Admin: job approval, provider document review, API key management
- [ ] Task alerts: alert created → job posted → alert matched → notification received
- [ ] Dashboard widgets: add/remove/reorder via drag-drop
- [ ] Email notifications: check Resend test logs for quote_received, quote_accepted, payment_released

### Automated tests to pass
- [ ] `npm run test:unit` — all unit tests green
- [ ] `npm run test:e2e:smoke` — all smoke tests green
- [ ] `npm run lint` — 0 TypeScript errors, English-only check passes

### Supabase (dev project) checks
- [ ] All migrations applied and no errors (check `marketplace/migrations/` for current count)
- [ ] RLS enabled on all tables — no `FOR ALL USING (true)` policies
- [ ] `pg_cron` jobs registered and running (provider_rankings refresh, automation rules)
- [ ] Edge functions deployed and responding:
  - `match-task-alerts`
  - `auto-release-payments`
  - `escalate-stale-disputes`
  - `id-verification-retention`
  - `message-retention`
  - `gdpr-retention-processor` (+ pg_cron schedule for daily/weekly run)

---

## Phase 2 — Account & Service Setup

Set up third-party accounts. Most have free tiers to start.

### Resend (Email)
- [x] Create Resend account at resend.com ✅ S38
- [x] Generate production API key → `RESEND_API_KEY` added to Vercel ✅ S38
- [ ] Add domain `workmate.ie` in Resend → verify DNS records (SPF, DKIM, DMARC) — **blocked on domain purchase**
  - Add records to DNS provider (Cloudflare recommended)
  - Wait for verification (usually < 1 hour)
- [ ] Test a real send from production domain before go-live
- **Cost:** Free tier = 3,000 emails/month. Pro = $20/month for 50k.

### Supabase (Production project — separate from dev)
- [ ] Create a new Supabase project for production (do NOT use dev project)
- [ ] Note: production URL + anon key + service role key
- [ ] Apply all migrations in Supabase SQL Editor (production) — run `ls marketplace/migrations/*.sql | wc -l` to confirm count
- [ ] Enable `pg_cron` extension on production project
- [ ] **Auth → Policies → Enable "Leaked Password Protection"** (HaveIBeenPwned check — Pro plan only)
- [ ] Set Auth → Site URL: `https://workmate.ie`
- [ ] Set Auth → Redirect URLs: `https://workmate.ie/auth/callback`
- [ ] Enable email confirmation (Auth → Email → Confirm email: ON)
- [ ] Configure Supabase Auth SMTP to use Resend:
  - Host: `smtp.resend.com`, Port: 465
  - Username: `resend`
  - Password: `RESEND_API_KEY`
  - Sender: `noreply@workmate.ie`
- [ ] Deploy edge functions to production project:
  ```bash
  supabase functions deploy match-task-alerts --project-ref <prod-ref>
  supabase functions deploy auto-release-payments --project-ref <prod-ref>
  supabase functions deploy escalate-stale-disputes --project-ref <prod-ref>
  supabase functions deploy id-verification-retention --project-ref <prod-ref>
  ```
- [ ] Set edge function secrets on production:
  ```
  TASK_ALERT_SECRET=<generate a random 32-char secret>
  SUPABASE_SERVICE_ROLE_KEY=<production service role key>
  RESEND_API_KEY=<production resend key>
  ```
- **Cost:** Free tier (500MB DB, 50k MAU). Pro = $25/month. Start free.

### Stripe (Production account)
- [ ] Complete Stripe business verification (company/individual — needs legal entity)
- [ ] Switch Stripe Dashboard from Test Mode to Live Mode
- [ ] Get live keys: `sk_live_*` and `pk_live_*`
- [ ] Enable Stripe Identity on live account (requires Stripe approval — submit request in Dashboard)
- [ ] Enable Stripe Connect (requires Stripe approval for platform — already done in test?)
- [ ] Create production webhook endpoint in Stripe Dashboard:
  - URL: `https://workmate.ie/api/webhooks/stripe`
  - Events to register:
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `payment_intent.canceled`
    - `charge.dispute.created`
    - `account.updated`
    - `identity.verification_session.verified`
    - `identity.verification_session.requires_input`
    - `invoice.paid`
    - `invoice.payment_succeeded`
  - Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET=whsec_live_*`
- [ ] Set `STRIPE_CONNECT_CLIENT_ID` to live Connect app client ID
- **Cost:** Stripe is pay-per-transaction (1.5% + 25c for EU cards). No monthly fee.

### Vercel (Hosting)
- [x] Create Vercel account + connect GitHub repo ✅
- [x] Set root directory to `marketplace/` ✅
- [x] Core env vars set (Supabase, Stripe, Resend, Anthropic, Sentry, Ideal Postcodes) ✅ S38
- [x] `LIVE_SERVICES_ENABLED=true` set for production ✅ S38
- [ ] Configure custom domain `workmate.ie` in Vercel settings — **blocked on domain purchase**
- **Cost:** Hobby = free (personal use). Pro = $20/month (commercial use, team features, higher limits). Use Pro for production.

### Sentry (Error Monitoring)
- [x] Sentry project created: org=`workmate-wz`, project=`workmate` ✅ S38
- [x] `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` all in Vercel ✅ S38
- [x] Sentry MCP configured in `.mcp.json` ✅ S38
- **Cost:** Free tier = 5k errors/month.

### UptimeRobot / BetterUptime (Uptime monitoring)
- [ ] Create account and add monitor: `https://workmate.ie`
- [ ] Add alert email/Slack for downtime
- **Cost:** UptimeRobot free = 50 monitors, 5-minute checks.

---

## Phase 3 — Business & Legal Setup

These require real-world actions and take the most time.

### Domain Name
- [ ] Purchase `workmate.ie` (or chosen domain) from an Irish registrar
  - Recommended: 123-ie.com, Register365, or Cloudflare Registrar
  - `.ie` domain: requires Irish presence (company or personal address)
  - **Cost:** ~€15-35/year for `.ie`
- [ ] Point domain nameservers to Cloudflare (free CDN + DNS management)
- [ ] In Cloudflare: add Vercel DNS records (A/CNAME), Resend DNS records

### Company Registration (Ireland)
- [ ] Register a private limited company (Ltd) with the Companies Registration Office (CRO)
  - Visit cro.ie or use an agent
  - Requires: company name, registered address, 1+ directors, constitution
  - **Cost:** €50 online registration fee + agent fees if used (~€200-400)
  - **Time:** 3-10 business days
- [ ] Get a PPS number (directors) if not already held
- [ ] Set up a business bank account (AIB, BOI, Revolut Business, etc.)
- [ ] Register for VAT if annual turnover will exceed €37,500 (services)
  - **Cost:** Free to register, but you collect/remit VAT (23% standard rate)
- [ ] Get an accountant (especially for VAT + payroll if employees)

### Stripe Business Verification
- [ ] After company is registered: complete Stripe business verification
  - Required: company registration number, director PPS, company address
  - Stripe may ask for bank statements or proof of address
  - **Time:** Can take 1-7 days for Stripe to review

### Stripe Identity (Stripe Approval)
- [ ] Submit Stripe Identity access request (in Stripe Dashboard → Identity)
  - Required: description of use case (ID verification for service marketplace)
  - **Time:** Usually approved in 1-3 business days

### Legal Pages (GDPR Required)
- [ ] Create `/terms` page (Terms of Service)
  - Must cover: user responsibilities, payment terms, dispute process, Irish law
- [ ] Create `/privacy` page (Privacy Policy)
  - GDPR compliant: what data collected, why, retention periods, right to erasure
  - Reference: Data Protection Commission guidelines (dataprotection.ie)
- [ ] Create `/cookies` page (Cookie Policy)
- [ ] Add cookie consent banner to site (required for EU/Ireland)
  - Options: CookieYes (free tier), Cookiebot, or build custom
- [ ] Register with Data Protection Commission if processing personal data at scale
  - **Cost:** ~€100/year for notification

### Content Pages
- [ ] Create `/about` page
- [ ] Create `/how-it-works` page
- [ ] Create `/community-guidelines` page (linked from sign-up form)
- [ ] Create `/forgot-password` page (auth flow references it)
- [ ] Seed production `categories` table with real Irish service categories
  - Cleaning, Plumbing, Electrical, Gardening, Painting, Moving, etc.

---

## Phase 4 — Go-Live Switch

When Phase 1-3 are complete, flip to production.

### Full Environment Variables (Production)
```
# Supabase (production project)
NEXT_PUBLIC_SUPABASE_URL=https://<prod-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-role-key>

# Stripe (LIVE keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_CONNECT_CLIENT_ID=ca_live_...

# Email
RESEND_API_KEY=re_live_...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# ⚡ MASTER LIVE SERVICES SWITCH — flip this to enable all paid services
# In dev this is unset (all paid calls are blocked). Must be set to 'true' in production.
LIVE_SERVICES_ENABLED=true

# Platform
NEXT_PUBLIC_PLATFORM_BASE_URL=https://workmate.ie
TASK_ALERT_SECRET=<random 32-char hex string>

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

### ⚡ Live Services Activation Checklist (DO NOT SKIP)
- [ ] **Set `LIVE_SERVICES_ENABLED=true`** in Vercel environment variables
  - Without this: Resend emails are blocked, AI endpoints return 503
  - File: `marketplace/lib/live-services.ts` — this is the master switch
- [ ] Verify `STRIPE_SECRET_KEY` starts with `sk_live_` (not `sk_test_`)
- [ ] Verify `RESEND_API_KEY` is the production key
- [ ] Verify `ANTHROPIC_API_KEY` is the production key
- [ ] Test a real email send after deployment (Resend dashboard → Logs)
- [ ] Test AI endpoint: POST `/api/ai/job-description` → should return 200 (not 503)

### Deployment steps
- [ ] Push all code to `main` branch
- [ ] Vercel auto-deploys → confirm deployment succeeds in Vercel dashboard
- [ ] Run health check: `curl https://workmate.ie/api/health` (if health endpoint exists)
- [ ] Test Stripe webhook: use Stripe CLI `stripe trigger payment_intent.succeeded` against prod endpoint
- [ ] Send a test email via Resend dashboard → confirm delivery
- [ ] Create a test account on production site → walk through full customer + provider flow
- [ ] Enable Supabase Row Level Security audit in Dashboard → confirm no violations

### DNS / CDN setup
- [ ] Cloudflare: set SSL/TLS mode to "Full (strict)"
- [ ] Cloudflare: enable "Always Use HTTPS"
- [ ] Cloudflare: add Vercel IPs / CNAME for `workmate.ie` and `www.workmate.ie`
- [ ] Add Resend SPF/DKIM/DMARC records in Cloudflare
- [ ] Verify email sending works after DNS propagation

---

## Deployment Strategy & Rollback

### Deployment Model

WorkMate uses a **Vercel auto-deploy** pipeline:

```
feature branch → PR → CI checks → merge to main → Vercel auto-deploy → production
```

### Staging via Vercel Preview Deployments

Every pull request automatically receives a **Vercel Preview Deployment** (`*.vercel.app` URL). Use these as staging environments:

- [ ] Verify UI changes visually on the preview URL before merging
- [ ] Run manual smoke tests (auth, job posting, quote flow) on the preview deployment
- [ ] Preview deployments share environment variables set under "Preview" scope in Vercel

### Canary Releases via Feature Flags

For high-risk changes, use the existing `feature_flags` table:

1. Merge the code behind a feature flag (`feature_flags.enabled = false`)
2. Deploy to production with the flag disabled
3. Enable the flag for a subset of users (e.g. admin accounts) via Supabase
4. Monitor Sentry + Vercel logs for errors
5. Gradually enable for all users by setting `enabled = true`

### Rollback Procedure

| Severity | Action | Time to recover |
|----------|--------|-----------------|
| UI regression | Vercel instant rollback (Dashboard → Deployments → promote previous) | < 1 minute |
| API breaking change | Vercel instant rollback + disable feature flag if applicable | < 2 minutes |
| Database migration issue | Follow `docs/DB_RUNBOOK.md` rollback procedure (rollback SQL files in `migrations/`) | 5-15 minutes |
| Stripe/payment issue | Disable `LIVE_SERVICES_ENABLED` → investigate → redeploy | < 5 minutes |

### Rollback Steps

1. Go to Vercel Dashboard → Deployments
2. Find the last known-good deployment
3. Click "Promote to Production"
4. Verify `/api/health` returns OK
5. If database migration caused the issue: run the corresponding `rollback_*.sql` from `marketplace/migrations/`
6. Post-mortem: document what broke and why in a decision record

---

## Phase 5 — Post-Launch Monitoring

### First 24 hours
- [ ] Monitor Vercel Functions logs for errors
- [ ] Monitor Supabase Dashboard → Logs → API logs
- [ ] Check Sentry for any runtime errors
- [ ] Check UptimeRobot — should be green
- [ ] Monitor Stripe Dashboard → Payments (confirm test payment through full flow)
- [ ] Check Resend activity log — emails delivering

### Ongoing
- [ ] Review Supabase `pg_cron` job logs weekly (provider_rankings refresh)
- [ ] Review Stripe webhook delivery logs (Dashboard → Webhooks → Recent deliveries)
- [ ] Check `profiles.api_key` rate limit usage monthly
- [ ] Rotate `TASK_ALERT_SECRET` every 6 months
- [ ] Review RLS policies after each schema migration

---

## Cost Summary (Estimated Monthly)

| Service | Free tier | Production estimate |
|---------|-----------|---------------------|
| Vercel (hosting) | Free (hobby) | $20/month (Pro) |
| Supabase (DB + auth) | Free (dev) | $25/month (Pro) |
| Resend (email) | 3k/month free | $20/month (50k) |
| Stripe | Pay-per-tx | 1.5% + 25c per transaction |
| Cloudflare (DNS + CDN) | Free | Free |
| Sentry (errors) | 5k errors free | Free → $26/month |
| UptimeRobot | Free | Free |
| Domain `.ie` | — | ~€25/year |
| Company registration | — | €50 + ~€300 agent (one-time) |
| Accountant | — | ~€1,000-2,000/year |

**Minimum monthly running cost (small scale):** ~€45-70/month
**Minimum one-time startup cost (company + domain):** ~€350-500

---

## What Can Be Activated Without Spending Money First

These can be set up before any business cost is committed:
1. Resend account (free) — email working
2. Supabase production project (free tier) — DB live
3. Vercel deployment (hobby plan) — site accessible at `.vercel.app` URL
4. Stripe test mode → full test with real browser, fake cards
5. All migrations applied and flows tested end-to-end

Only commit to domain + company after you are satisfied the product works correctly.
