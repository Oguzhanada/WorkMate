# WorkMate (Ada Marketplace) - AI Context File
> Last updated: 2026-03-05
> Session: 7

---

## 1. PROJECT IDENTITY

| Field | Value |
|------|-------|
| Name | WorkMate (code name: Ada Marketplace) |
| Description | Ireland-focused services marketplace |
| Repo | `github.com/Oguzhanada/WorkMate` |
| Main folder | `marketplace/` |
| Status | Development |
| Target market | Ireland (26 counties, Eircode) |
| Product language | English-only (UI, docs, errors, policy pages) |

---

## 2. TECH STACK

- Frontend: Next.js 16.1.6 (App Router, Turbopack), React 19, TypeScript
- Backend: Next.js API routes + Supabase Edge Functions
- Database: Supabase PostgreSQL with RLS
- Auth: Supabase Auth (Email/Password + Google/Facebook OAuth)
- Payments: Stripe Connect (secure hold → capture/refund)
- Styling/UI: Tailwind CSS, CSS modules, shadcn/ui primitives, Framer Motion
- Validation: Zod + custom Ireland validators (Eircode, phone, name)
- i18n: next-intl infrastructure, English content only

---

## 3. ARCHITECTURE SUMMARY

```text
marketplace/
├── app/
│   ├── [locale]/                    # routed pages
│   ├── api/                         # server endpoints
│   ├── auth/callback/route.ts       # OAuth callback
│   └── layout.tsx / globals.css
├── components/
│   ├── auth/ dashboard/ disputes/
│   ├── forms/ home/ payments/ profile/
│   ├── site/ ui/
│   ├── jobs/                        # Hybrid job mode selector
│   └── offers/                      # Offer card UI
├── lib/
│   ├── auth/                        # RBAC helpers
│   ├── supabase/                    # browser/server/route/service clients
│   ├── validation/                  # Zod + custom validators
│   ├── ranking/ pricing/ types/     # Airtasker-style feature layer
│   └── constants/ hooks/
├── migrations/                      # 001..047
├── supabase/functions/              # edge functions
└── messages/en.json
```

---

## 4. DATABASE SCHEMA

### Core tables
- `profiles`, `user_roles`
- `jobs`, `quotes`, `reviews`
- `pro_documents`, `pro_services`, `pro_service_areas`
- `notifications`, `payments`, `job_messages`
- `categories`, `addresses`, `job_intents`
- `disputes`, `dispute_logs`, `dispute_evidence`

### New/extended feature tables
- `task_alerts`
- `customer_provider_history`
- `quote_daily_limits`
- Materialized view: `provider_rankings`

### Verification states (active model)
- `profiles.id_verification_status`: `none | pending | approved | rejected`
- `profiles.verification_status`: provider workflow status layer
- `pro_documents.verification_status`: `pending | verified | rejected | request_resubmission`

---

## 5. COMPLETED FEATURES

- [x] Auth system (login/signup/OAuth/reset)
- [x] Multi-role RBAC (customer + provider + admin)
- [x] Job posting flow (guest + authenticated)
- [x] Provider onboarding and document upload
- [x] Admin review panel (job approval + provider docs)
- [x] Stripe secure hold flow + capture + webhook route
- [x] Disputes and payment release escalation base
- [x] Progressive verification tiers (`035`)
- [x] Airtasker-style feature foundation (`036`)
  - quote expiry + ranking score columns
  - task alerts table + RLS
  - customer/provider history + RPC increment
  - provider rankings materialized view + refresh function
- [x] Offer ranking badges in customer quote list (`OfferRankingBadge`, framer-motion, amber glow)
- [x] Task alerts UI in provider dashboard (`TaskAlertsPanel` + `/api/task-alerts` GET/POST/DELETE)
- [x] Customer dashboard refactored — data extracted to `lib/queries/customer-dashboard.ts`, parallel queries
- [x] Stripe webhook expanded — payment failure, chargeback admin notify, Connect account sync (`038`)
- [x] provider_rankings cartesian join bug fixed (`037`) — `completed_jobs` now correct per-provider
- [x] Stripe account status columns on profiles (`stripe_charges_enabled`, `stripe_payouts_enabled`)
- [x] Public API v1 layer + API key management + webhook subscribe/revoke routes (`045`, `046`, `/api/public/v1/*`)
- [x] Webhook event delivery integration for `job.created`, `quote.accepted`, `payment.completed`
- [x] Time tracking + invoicing foundation (`047`)
  - `time_entries` table + strict RLS
  - provider timer APIs + customer approval flow
  - Stripe invoice creation route + job `stripe_invoice_id` persistence

---

## 6. ACTIVE TASK

**Current task:** Session 7 checkpoint and handoff completed.

- Prompt 5 and Prompt 6 shipped.
- API-only smoke flow for time tracking/invoice passed.
- TypeScript and lint checks green.

---

## 7. PENDING TASKS (PRIORITY ORDER)

1. [ ] Apply and verify migration `047_time_tracking_and_invoicing.sql` across all envs.
2. [ ] Add automated tests for time-entry permission and invoice edge cases.
3. [ ] Add webhook delivery observability and failed-delivery monitoring.
4. [ ] Implement API key scopes and key rotation audit trail.
5. [ ] E2E smoke tests: task alerts, offer ranking, time tracking + invoice flow.
6. [ ] provider_rankings nightly pg_cron health check — alert if refresh fails silently.
7. [ ] Verify provider onboarding end-to-end for pre-verified ID user.

---

## 8. KNOWN ISSUES

- Category API fallback can block provider submission if DB categories are unavailable.
- Stripe Dashboard production webhook: when deploying, register `account.updated`, `charge.dispute.created`, `payment_intent.payment_failed`, `payment_intent.canceled` events.
- Stripe Dashboard not yet updated to send `account.updated` / `charge.dispute.created` events — webhook handlers are ready on our side but will not receive these events until registered.
- `provider_rankings` mat view is empty (dev environment has no verified_pro users yet) — ranking scores will be 0 until real data exists.

---

## 9. IMPORTANT DECISIONS

- Ireland-only product/legal context is mandatory.
- English-only content is mandatory across product and docs.
- Use existing schema names and enums; do not copy external schema names blindly.
- Keep RLS strict and scoped (no open `FOR ALL USING (true)` patterns).
- Do not use competitor-negative language in public pages; use neutral product positioning.

---

## 10. API / ENDPOINT LIST (KEY)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs` | POST | Create job with review + tier metadata |
| `/api/quotes` | POST | Submit quote with limits/expiry/ranking |
| `/api/categories` | GET | Categories with fallback |
| `/api/admin/pending-jobs` | GET | Admin queue |
| `/api/admin/jobs/[jobId]/approve` | PATCH | Approve job |
| `/api/admin/jobs/[jobId]/reject` | PATCH | Reject job |
| `/api/disputes` | POST | Create dispute |
| `/api/webhooks/stripe` | POST | Stripe events |
| `/functions/v1/id-verification-retention` | POST | ID retention cleanup |
| `/functions/v1/auto-release-payments` | POST | Auto payment release |
| `/functions/v1/escalate-stale-disputes` | POST | Escalate stale disputes |
| `/functions/v1/match-task-alerts` | POST | Match jobs to task alerts |

---

## 11. IRELAND COMPLIANCE BASELINE

- Provider docs: ID, Public Liability Insurance, Safe Pass, Tax Clearance (where applicable).
- Eircode validation enforced in posting flows.
- Irish phone validation enforced in onboarding/profile.
- No forced PPSN collection in baseline app flow.

---

## 12. WORKING PROTOCOL

- Do not auto-create checkpoints every 5 messages.
- Create `CHECKPOINT_*.md` only when:
  - a major feature block is completed,
  - context health is high,
  - user explicitly says: `checkpoint al`.
- Do not prepend a fixed stack line to every response.
- Day summary is generated only when user says: `gün bitti`.
- Context warning format is fixed:
  - `Context health: OK`
  - `Context health: High usage`
  - `Context health: Save checkpoint now`

---

## 13. REFERENCE LINKS

- Repo: `https://github.com/Oguzhanada/WorkMate`
- Supabase docs: `https://supabase.com/docs`
- Stripe Connect docs: `https://stripe.com/docs/connect`
- Next.js docs: `https://nextjs.org/docs`
- Eircode: `https://www.eircode.ie`

---

## 14. PRODUCTION LAUNCH CHECKLIST

### 🔴 Blocker — must be done before go-live

**Infrastructure**
- [ ] Deploy to production host (Vercel recommended — zero-config Next.js)
- [ ] Set all env vars on host (`SUPABASE_*`, `STRIPE_*`, `TASK_ALERT_SECRET`, `NEXT_PUBLIC_PLATFORM_BASE_URL=https://yourdomain.ie`)
- [ ] Point custom domain, configure SSL

**Supabase**
- [ ] Confirm all migrations 001–039 applied on production Supabase project (separate from dev)
- [ ] Enable `pg_cron` extension on production project
- [ ] Set Supabase Auth → Site URL + Redirect URLs to production domain
- [ ] Confirm OAuth redirect URIs updated in Google/Facebook app consoles
- [ ] Deploy all edge functions to production project: `match-task-alerts`, `auto-release-payments`, `escalate-stale-disputes`, `id-verification-retention`, `message-retention`
- [ ] Set edge function secrets on production: `TASK_ALERT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`

**Stripe**
- [ ] Switch from test keys (`sk_test_*`) to live keys (`sk_live_*`) in production env
- [ ] Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `pk_live_*`
- [ ] Create production webhook endpoint in Stripe Dashboard → `https://yourdomain.ie/api/webhooks/stripe`
- [ ] Register all required events: `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.dispute.created`, `account.updated`, `identity.verification_session.verified`, `identity.verification_session.requires_input`, `payment_intent.succeeded`
- [ ] Update `STRIPE_WEBHOOK_SECRET` to production webhook signing secret (`whsec_live_*`)
- [ ] Set `STRIPE_CONNECT_CLIENT_ID` to live Connect app client ID
- [ ] Enable Stripe Identity on live account (requires Stripe approval)
- [ ] Complete Stripe business verification to accept live payments

**Security**
- [ ] Confirm `.env.local` is in `.gitignore` — never commit secrets
- [ ] Review all RLS policies with production data volume in mind
- [ ] Enable Supabase email confirmation (Auth → Email → Confirm email enabled)
- [ ] Set rate limiting on `/api/jobs`, `/api/quotes` (Vercel Edge Config or middleware)

---

### 🟡 Important — do before first real users

**Content**
- [ ] Terms of Service page (`/terms`)
- [ ] Privacy Policy page (`/privacy`) — GDPR compliant (Ireland/EU)
- [ ] Cookie consent banner (required for EU)
- [ ] About / How it works page

**Email**
- [ ] Configure Supabase Auth SMTP (custom domain email, e.g. SendGrid or Resend) — avoid Supabase default `@supabase.io` sender
- [ ] Test auth emails: confirm, reset password, magic link

**Monitoring**
- [ ] Set up error tracking (Sentry or similar)
- [ ] Supabase Dashboard → Logs → confirm no RLS violations or 500 errors post-launch
- [ ] Set up uptime monitoring (UptimeRobot or BetterUptime)

**Categories**
- [ ] Seed production `categories` table with real Irish service categories (currently only dev data)

---

### 🟢 Nice to have before scale

- [ ] CDN for job photos (Supabase Storage CDN or Cloudflare)
- [ ] Admin analytics dashboard (job/quote/payment volume)
- [ ] Email notifications for key events (job matched, quote received, payment released)
- [ ] App Store / Play Store (if React Native wrapper planned)

---

## 15. LAST CHANGES (SESSION 4 — 2026-03-05)

1. `marketplace/migrations/037` + `038` written and confirmed live in DB (provider_rankings fix + Stripe account status).
2. `marketplace/components/offers/OfferRankingBadge.tsx` + CSS — amber TOP OFFER badge with framer-motion spring animation.
3. `marketplace/lib/queries/customer-dashboard.ts` — extracted all queries from customer page; parallel fetch, ranking sort.
4. `marketplace/app/api/task-alerts/route.ts` + `TaskAlertsPanel.tsx` + wired into ProDashboard.
5. `marketplace/app/api/webhooks/stripe/route.ts` — added payment failure, chargeback, and Connect account sync handlers.
