# WorkMate (Ada Marketplace) - AI Context File
> Last updated: 2026-03-10
> Session: 28 (originally written session 10, incrementally updated)
> Team: 8-Agent Structure (PM, Frontend, Backend, Fintech, Design, Compliance, QA, DevOps)

---

## 0. PROJECT MANAGEMENT & RULES
- **Team**: Project Manager (AI), FrontendAgent, BackendAgent, FintechAgent, DesignAgent, ComplianceAgent, QAAgent, DevOpsAgent.
- **Language**: English-only (Output, Code, UI, Docs).
- **Currency**: Cents (EUR) ONLY.
- **Security**: Strict RLS (No exceptions).
- **Design**: Apple premium level (copious whitespace, soft shadows, green accent).
- **Protocol**: 
  - PM provides task summary and agent assignments.
  - ComplianceAgent approval required before merging code.
  - QAAgent testing required for all tasks.

---

## 1. PROJECT IDENTITY

| Field | Value |
|------|-------|
| Name | WorkMate (code name: Ada Marketplace) |
| Description | Ireland-focused services marketplace |
| Repo | `github.com/Oguzhanada/WorkMate` |
| Main folder | `marketplace/` |
| Status | Development — pre-production |
| Target market | Ireland (26 counties, Eircode) |
| Product language | English-only (UI, docs, errors, policy pages) |
| Deployed | Vercel — `work-mate-neon.vercel.app` (test env) |

---

## 2. TECH STACK

- Frontend: Next.js 16.1.6 (App Router, Turbopack), React 19, TypeScript
- Backend: Next.js API routes + Supabase Edge Functions
- Database: Supabase PostgreSQL with RLS
- Auth: Supabase Auth (Email/Password + Google/Facebook OAuth)
- Payments: Stripe Connect (secure hold → capture/refund)
- Styling/UI: Tailwind CSS v4, CSS modules, Framer Motion, @dnd-kit (drag-drop)
- Validation: Zod + custom Ireland validators (Eircode, phone, name)
- i18n: next-intl infrastructure, English content only
- Email: Resend (`notifications@workmate.ie`) — needs RESEND_API_KEY

---

## 3. ARCHITECTURE SUMMARY

```text
marketplace/
├── app/
│   ├── [locale]/                    # all routed pages (locale-aware)
│   │   ├── dashboard/customer|pro|admin/
│   │   ├── login/ sign-up/ forgot-password/ reset-password/
│   │   ├── post-job/ profile/ providers/ jobs/[jobId]/
│   │   └── layout.tsx
│   ├── api/                         # server endpoints
│   │   ├── jobs/ quotes/ messages/ reviews/ categories/
│   │   ├── admin/ connect/ disputes/ public/v1/
│   │   ├── profile/ user/dashboard/widgets/
│   │   └── webhooks/stripe/
│   ├── auth/callback/route.ts       # OAuth callback
│   ├── actions/                     # server actions (offers.ts, task-alerts.ts)
│   └── layout.tsx / globals.css
├── components/
│   ├── auth/                        # LoginForm, SignUpForm, BrandColumn...
│   ├── dashboard/
│   │   ├── DashboardShell.tsx       # main widget system shell
│   │   ├── WidgetGrid.tsx           # @dnd-kit drag-drop grid
│   │   ├── widget-types.ts          # shared DashboardWidgetRow type
│   │   └── widgets/                 # WidgetRenderer + 9 widget cards
│   ├── forms/ home/ payments/ profile/
│   ├── site/ ui/                    # Shell, Card, StatCard, Badge, Button...
│   ├── jobs/                        # TimeTracking, JobScheduler, JobCollaborationPanel
│   └── offers/                      # OfferCard, OfferRankingBadge
├── lib/
│   ├── auth/rbac.ts                 # RBAC helpers (canAccessAdmin, getUserRoles...)
│   ├── dashboard/widgets.ts         # DashboardMode, WidgetType, defaults
│   ├── supabase/client|server|route|service.ts
│   ├── email/client|send|templates.ts  # Resend email layer
│   ├── api/public-auth.ts           # API key + rate limiting
│   ├── webhook/send.ts              # HMAC-SHA256 signed delivery
│   ├── automation/engine.ts         # automation rules engine
│   ├── jobs/access.ts               # participant access resolver
│   ├── ranking/ pricing/ types/     # Airtasker-style feature layer
│   ├── validation/ constants/ hooks/ i18n/ onboarding/
│   └── (no lib/supabase.ts — deleted, all use getSupabaseBrowserClient() inline)
├── migrations/                      # 001..073 ALL APPLIED
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

### Feature tables (applied migrations)
- `task_alerts` (036)
- `customer_provider_history`, `quote_daily_limits` (036)
- `job_todos`, `job_collaboration_messages`, `job_files` (041, 042)
- `automation_rules` (043, 044)
- `api_keys`, `webhook_subscriptions` (045, 046)
- `time_entries` + invoice columns on `jobs` (047)
- `provider_availability_slots`, `job_appointments` (048)
- `dashboard_widgets` (049)
- Materialized view: `provider_rankings`

### Verification states (two-layer model)
- `profiles.id_verification_status`: `none | pending | approved | rejected`
- `profiles.verification_status`: provider workflow status
- `pro_documents.verification_status`: `pending | verified | rejected | request_resubmission`

---

## 5. COMPLETED FEATURES (Sessions 1-10)

### Core (Sessions 1-3)
- [x] Auth system (login/signup/OAuth/reset)
- [x] Multi-role RBAC (customer + verified_pro + admin)
- [x] Job posting flow (guest + authenticated, multi-step)
- [x] Provider onboarding and document upload
- [x] Admin review panel (job approval + provider docs)
- [x] Stripe secure hold flow + capture + webhook route
- [x] Disputes and payment release escalation
- [x] Progressive verification tiers (`035`)

### Airtasker Feature Layer — Prompts 1-4 (Sessions 4-6)
- [x] Airtasker-style foundation — ranking score, task alerts, provider rankings (`036`, `037`)
- [x] `OfferRankingBadge` — amber TOP OFFER badge, framer-motion spring animation
- [x] `TaskAlertsPanel` + `/api/task-alerts` GET/POST/DELETE
- [x] Stripe webhook expanded — payment failure, chargeback, Connect account sync (`038`)
- [x] Direct request + job mode flows (`039`) — `quick_hire | direct_request | get_quotes`
- [x] Job collaboration: messages + todos + files (`041`, `042`)
- [x] Admin Analytics Dashboard — SVG charts (`AnalyticsDashboard.tsx`)
- [x] Automation Rules Engine — `lib/automation/engine.ts`, CRUD UI, pg_cron (`043`, `044`)

### Prompt 5 — Public API + Webhooks (Session 7)
- [x] `lib/api/public-auth.ts` — API key validation + in-memory rate limiting
- [x] `lib/webhook/send.ts` — HMAC-SHA256 signed delivery, HTTPS-only, retry
- [x] `app/api/public/v1/` — GET jobs, GET jobs/[id], GET providers, POST/DELETE webhooks
- [x] `app/api/profile/api-key/` — POST (generate), DELETE (revoke)
- [x] `ApiKeyCard.tsx`, `AdminApiKeysPanel.tsx`
- [x] Webhook events wired: `job.created`, `quote.accepted`, `payment.completed`

### Prompt 6 — Time Tracking + Invoicing (Session 7)
- [x] `lib/jobs/access.ts` — participant access resolver
- [x] `/api/jobs/[jobId]/time-entries/` — GET/POST + PATCH/DELETE
- [x] `/api/jobs/[jobId]/create-invoice/` — Stripe invoice from time entries
- [x] `TimeTracking.tsx` — timer UI + customer approval

### Prompt 7 — Resource Scheduling & Calendar (Session 8)
- [x] `/api/providers/[providerId]/availability/` — GET/POST/DELETE slots
- [x] `/api/jobs/[jobId]/appointments/` — GET/POST
- [x] `/api/appointments/[appointmentId]/` — PATCH (reschedule/confirm/cancel)
- [x] `ProviderAvailability.tsx`, `JobScheduler.tsx`

### Prompt 8 — Customizable Dashboard Widgets (Session 8)
- [x] `lib/dashboard/widgets.ts` — DashboardMode, WidgetType, allowed/default config
- [x] `/api/user/dashboard/widgets/` — GET/POST + PATCH/DELETE
- [x] `DashboardShell.tsx` + `WidgetGrid.tsx` (@dnd-kit drag-drop)
- [x] `widgets/` folder — WidgetRenderer + 9 widget cards (including CustomerStatsWidget)
- [x] All dashboard pages (customer/pro/admin) use `DashboardShell mode="..."`

### Prompt 9 — Email Notifications (Session 9)
- [x] `lib/email/client.ts` — Resend singleton
- [x] `lib/email/templates.ts` — quoteReceived, quoteAccepted, paymentReleased (inline HTML)
- [x] `lib/email/send.ts` — fire-and-forget dispatcher
- [x] Wired: POST /api/quotes → customer; accept-quote → provider; Stripe invoice.paid → provider

### Session 9 — Auth & UI Audit Fixes
- [x] `identityConsent` error now renders in SignUpForm
- [x] Post-login redirect: `/profile` → `/dashboard/customer`
- [x] Already-logged-in redirect on login page → `/dashboard/customer`
- [x] Customer dashboard: smart role redirect (admin/pro/customer)
- [x] Navbar: "Post a Job" button for customer role
- [x] DashboardShell: "+ Post a Job" CTA for customer mode

### Session 10 — Codebase Cleanup
- [x] Deleted 9 orphan/legacy files (non-locale pages, (auth) group, apple/ components)
- [x] Deleted `ProDashboard.tsx`, `lib/queries/customer-dashboard.ts`, orphan test
- [x] Migrated all components from `lib/supabase.ts` singleton to `getSupabaseBrowserClient()` inline
- [x] Deleted `lib/supabase.ts`
- [x] Archived old checkpoint docs and `docs/memory/` snapshot

### Sessions 11–28 — Summary (see MEMORY.md for full detail)

> **All Phase 1–4 features COMPLETE.** Production readiness sweep DONE. Security audit DONE.

Key milestones since session 10:
- **Design system** (session 16): Full `--wm-*` token system, zero hardcoded hex, custom fonts (Syne + Plus Jakarta Sans)
- **Phases 1–4** (sessions 13–22): 60+ Zod schemas, 104 API routes, rate limiting, GDPR export/delete, funnel telemetry, notification bell, admin analytics, provider subscriptions, job contracts, Garda vetting, risk scoring
- **Production readiness** (session 23): SEO infra (JSON-LD, OG images), 15 loading.tsx files, CSP headers, GDPR automation edge function
- **Bug/QA sweep** (session 24): Security fixes (admin auth, error leaks, rate limiting), 29 FK indexes, raw button→Button migration, hex→token cleanup
- **Strategy implementation** (session 26): Plan-based commission, cookie consent, WCAG fixes, DPAs signed, GDPR cron deployed
- **Architecture restructure** (session 27): `lib/ireland/`, `lib/data/`, `lib/stripe/client.ts` file moves, `components/ui/index.ts` barrel, Husky + lint-staged, FD-16–FD-22 frozen rules
- **Agent governance** (session 28): CI workflow fixes, FD-23 (feature branches only), FD-24 (no bloat docs), FD-25 (skill gitignore whitelist)

Migrations 051–073: ALL APPLIED. Key tables: funnel_events, saved_searches, portfolio_items, job_contracts, provider_subscriptions, feature_flags, webhook_events, referral_codes, founding_pro_config, provider_availability, job_mode_enhancements.

New libs: `lib/analytics/funnel.ts`, `lib/notifications/send.ts`, `lib/profile/completeness.ts`, `lib/rate-limit/`, `lib/api/error-response.ts`

---

## 6. CURRENT STATE

- Migrations 001-073: ALL APPLIED in Supabase
- Next migration: **074**
- Vercel deployment: active at `work-mate-neon.vercel.app`
- Stripe: test mode (`sk_test_*`) — no real charges
- Email sender: `notifications@workmate.ie` — Resend domain must be verified before go-live

---

## 7. PENDING TASKS (updated session 28)

> All automated code work DONE. Security audit DONE. Only manual launch tasks remain.
> See `docs/PRODUCTION_LAUNCH.md` for the full go-live checklist.

### Manual-only launch blockers
1. [ ] Purchase domain `workmate.ie` + connect to Vercel
2. [ ] Enable Supabase Pro + PITR backup
3. [ ] Set `NEXT_PUBLIC_PLATFORM_BASE_URL` to production domain in Vercel
4. [ ] Set `LIVE_SERVICES_ENABLED=true` in Vercel env vars (go-live day)
5. [ ] Switch Stripe keys from `sk_test_*` to `sk_live_*`
6. [ ] Verify Resend domain `workmate.ie` (SPF/DKIM/DMARC)
7. [ ] UX testing — 3-5 real users
8. [ ] Responsive/browser testing — Safari, Firefox, mobile
9. [ ] Lighthouse manual run on production URL

### Code quality (post-launch)
10. [ ] Error response helper migration — ~55 routes still use raw `NextResponse.json`
11. [ ] `next/image` migration — replace `<img>` with `Image` component
12. [ ] Large component refactoring (AdminApplicationsPanel 1456 LOC, JobMultiStepForm 956 LOC)
13. [ ] TypeScript `strict: true` pilot on new files

### Future features
- See `ai-context/decisions/` for DR-003 (refund policy), DR-004 (provider funnel), DR-005 (flow maturity)
- Mobile app (React Native + Expo) — long term
- UK / Northern Ireland expansion — long term

---

## 8. KNOWN ISSUES

- `pro/page.tsx` passes a `header` Card to Shell; `customer/page.tsx` does not — minor inconsistency, low priority
- Migrations `021_pro_documents_rls.sql` and `021_user_roles_multi_role.sql` both numbered 021 — both applied, cannot rename, doc-only
- `provider_rankings` materialized view empty in dev (no verified_pro test users) — ranking scores = 0 until real data

---

## 9. IMPORTANT DECISIONS

- Ireland-only product/legal context is mandatory
- English-only content across all product, docs, and errors
- RLS strict on all tables — no `FOR ALL USING (true)`
- All money in cents (`*_amount_cents`), EUR only
- Quotes sorted: `ranking_score DESC` → `provider_matching_priority DESC` → `created_at DESC`
- Zod 4: `z.record()` needs 2 args — `z.record(z.string(), z.string())`
- Webhook delivery: HTTPS-only, HMAC-SHA256 via `X-WorkMate-Signature` header
- Public API auth: `x-api-key` header → `profiles.api_key` lookup
- Supabase client pattern: always call `getSupabaseBrowserClient()` inside async callbacks, never at module scope

---

## 10. API ENDPOINT LIST (KEY)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs` | POST | Create job |
| `/api/quotes` | POST | Submit quote with ranking |
| `/api/jobs/[jobId]/accept-quote` | PATCH | Accept quote + trigger email |
| `/api/jobs/[jobId]/time-entries` | GET/POST | Time tracking |
| `/api/jobs/[jobId]/create-invoice` | POST | Stripe invoice |
| `/api/jobs/[jobId]/appointments` | GET/POST | Scheduling |
| `/api/appointments/[id]` | PATCH | Reschedule/confirm/cancel |
| `/api/user/dashboard/widgets` | GET/POST | Widget layout |
| `/api/admin/pending-jobs` | GET | Admin queue |
| `/api/admin/analytics` | GET | SVG chart data |
| `/api/admin/automation-rules` | GET/POST | Automation rules |
| `/api/profile/api-key` | POST/DELETE | API key management |
| `/api/public/v1/jobs` | GET | Public API |
| `/api/public/v1/webhooks/subscribe` | POST/DELETE | Webhook subscriptions |
| `/api/webhooks/stripe` | POST | Stripe events |
| `/functions/v1/match-task-alerts` | POST | Edge function |
| `/functions/v1/auto-release-payments` | POST | Edge function |

---

## 11. IRELAND COMPLIANCE BASELINE

- Provider docs: ID, Public Liability Insurance, Safe Pass, Tax Clearance (where applicable)
- Eircode validation enforced in all posting flows
- Irish phone validation (+353, prefixes 83/85/86/87/89)
- No forced PPSN collection in baseline app flow

---

## 12. WORKING PROTOCOL

- Checkpoint only when user says `checkpoint al`
- Day summary only when user says `gün bitti`
- Context warning: `Context health: OK` / `High usage` / `Save checkpoint now`
- Turkish input OK, English-only code and output

---

## 13. FLOW MATURITY ROADMAP (LOCKED PRIORITY, 2026-03-09)

Reference:
- `marketplace/docs/flow-maturity-roadmap-10w.md`
- `ai-context/decisions/DR-003-cancellation-refund-policy.md`
- `ai-context/decisions/DR-004-provider-funnel-standardization.md`
- `ai-context/decisions/DR-005-flow-maturity-consolidation.md`

Priority order (must be preserved):
1. Provider funnel
2. Trust and policy certainty
3. Ops reliability + telemetry

Timeline policy:
- Legacy 8-week assumption is superseded.
- Planning baseline is now 10 weeks (realistic execution).

Phase fallback:
- If provider scope drifts, quote SLA enforcement moves from Phase A to Phase B automatically.
- Telemetry remains "lite" in initial rollout; advanced anomaly logic is a later iteration.
- Never auto-create checkpoints between explicit requests

---

## 13. PRODUCTION LAUNCH CHECKLIST

### Blocker — must be done before go-live

**Infrastructure**
- [ ] Point custom domain + configure SSL
- [ ] Set all env vars on Vercel (`SUPABASE_*`, `STRIPE_*`, `RESEND_API_KEY`, `TASK_ALERT_SECRET`)

**Supabase**
- [ ] Confirm migrations 001-073 applied on production Supabase project
- [ ] Enable `pg_cron` on production project
- [ ] Set Auth Site URL + Redirect URLs to production domain
- [ ] Update OAuth redirect URIs in Google/Facebook consoles
- [ ] Deploy edge functions: `match-task-alerts`, `auto-release-payments`, `escalate-stale-disputes`, `id-verification-retention`, `message-retention`

**Stripe**
- [ ] Switch to live keys (`sk_live_*`, `pk_live_*`)
- [ ] Create production webhook → `https://yourdomain.ie/api/webhooks/stripe`
- [ ] Register all events: `payment_intent.*`, `charge.dispute.created`, `account.updated`, `identity.verification_session.*`
- [ ] Enable Stripe Identity on live account
- [ ] Complete Stripe business verification

**Email**
- [ ] Verify `workmate.ie` domain in Resend dashboard
- [ ] Test transactional emails end-to-end

**Security**
- [ ] Review all RLS policies with production data volume
- [ ] Enable Supabase email confirmation
- [ ] Set rate limiting on `/api/jobs`, `/api/quotes`

### Important — before first real users

- [ ] Seed production `categories` table
- [ ] Set up error tracking (Sentry)
- [ ] Set up uptime monitoring

---

## 14. REFERENCE

- Repo: `https://github.com/Oguzhanada/WorkMate`
- Supabase project: `ejpnmcxzycxqfdbetydp.supabase.co`
- Deployed: `work-mate-neon.vercel.app`
- Supabase docs: `https://supabase.com/docs`
- Stripe Connect docs: `https://stripe.com/docs/connect`
