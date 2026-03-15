# WorkMate (Ada Marketplace) - AI Context File
> Last updated: 2026-03-13
> Session: 36 (alignment audit — doc sync)
> Governance: Skill-based (11 skills) + Frozen Decisions (FD-01→FD-33) + CI/CD

---

## 0. PROJECT MANAGEMENT & RULES

> **Guardrails & frozen decisions**: See `ai-context/context/agents.md` (conflict-resolution authority).
> Rules below are **state snapshots**, not the canonical source. If any conflict, `agents.md` wins.

- **Team**: Project Manager (AI), FrontendAgent, BackendAgent, FintechAgent, DesignAgent, ComplianceAgent, QAAgent, DevOpsAgent.
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

- Frontend: Next.js 16.1.6 (App Router, Turbopack), React 19, TypeScript (`strict: true` — FD-31)
- Backend: Next.js API routes + Supabase Edge Functions (6 deployed)
- Database: Supabase PostgreSQL with RLS (check `marketplace/migrations/` for count)
- Auth: Supabase Auth (Email/Password + Google/Facebook OAuth) — email+phone verified on prod
- Payments: Stripe Connect (secure hold → capture/refund) — Identity bypass in test, active on prod
- Styling/UI: Tailwind CSS v4, `--wm-*` design tokens, Framer Motion, @dnd-kit (drag-drop)
- Validation: Zod 4 + custom Ireland validators (Eircode, phone, name)
- i18n: next-intl infrastructure, English content only
- Email: Resend (`notifications@workmate.ie`, 11 templates) — always enabled (`liveServices.email = true`; Resend free tier, no card required; `EMAIL_SEND_ENABLED` env var does NOT control email)
- AI: groq (native fetch via `lib/ai/groq.ts`) — guarded by `AI_CALLS_ENABLED`
- Monitoring: @sentry/nextjs (tunnel at /monitoring)
- Maps: leaflet + react-leaflet

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
├── migrations/                      # ALL APPLIED (check dir for current count)
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
- `task_alerts`, `customer_provider_history`, `quote_daily_limits` (036)
- `job_todos`, `job_collaboration_messages`, `job_files` (041, 042)
- `automation_rules` (043, 044)
- `webhook_subscriptions` (046) — note: 045 NOT applied (superseded by 060)
- `time_entries` + invoice columns on `jobs` (047)
- `provider_availability_slots`, `job_appointments` (048)
- `dashboard_widgets` (049)
- compliance_score columns (050), review_dimensions (051), favourite_providers (052)
- appointment_remote_fields (053), provider_risk_score (054), garda_vetting (055, removed in 074)
- `job_contracts` (056), `feature_flags` (057), `provider_subscriptions` (058)
- `webhook_events` idempotency key (059), `api_key_hash` on profiles (060)
- `funnel_events` (061), gdpr_deletion_requests (062), notification bell (063)
- review_responses (064), `provider_availability` (065), `saved_searches` (066)
- `portfolio_items` (067), FK indexes (068), portfolio consolidation (069)
- `job_auto_expire` (070), `founding_pro` (071), `referral_system` (072), `job_mode_enhancements` (073)
- `remove_garda_vetting` (074), `dispute_types` (075), `provider_credits` + `credit_transactions` (076), `loyalty_level` on profiles (077)
- `provider_search_indexes` — 10 `CREATE INDEX CONCURRENTLY` (078), `username_system` (079)
- Materialized view: `provider_rankings`

### Verification states (two-layer model)
- `profiles.id_verification_status`: `none | pending | approved | rejected`
- `profiles.verification_status`: provider workflow status
- `pro_documents.verification_status`: `pending | verified | rejected | request_resubmission`

---

## 5. COMPLETED FEATURES (Sessions 1-28)

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

### Sessions 11-22 — Phase 1-4 Feature Build
> Detailed log: `memory/session-history.md`

- [x] Design system complete — `--wm-*` tokens, Syne/Plus Jakarta Sans fonts, zero hardcoded hex
- [x] JobContractPanel, Subscription Stripe Webhook (5 events), Garda Vetting self-service
- [x] Admin Risk Score bulk, GDPR Export/Delete, Funnel Telemetry (`lib/analytics/funnel.ts`)
- [x] 6 new email templates (contract/vetting/subscription), In-App Notification Bell (30s polling)
- [x] Admin Funnel Analytics (CSS bars, date filter, StatCards)
- [x] sendNotification wiring (11 triggers across 6 files)
- [x] Profile Completeness Widget (8 checks), Provider Onboarding Funnel (6 steps)
- [x] Marketplace Advanced Search (31 counties, price range, verified/garda filters)
- [x] Job Status Timeline (5 steps), Rate Limiting Middleware (sliding window)
- [x] Admin Verification Queue (batch approve/reject)

### Session 23 — Production Readiness Sweep
- [x] SEO: JSON-LD, /api/health, manifest, sitemap, robots, CSP headers
- [x] OG image route, GDPR automation edge function, design token sweep (70+ fixes)
- [x] 15 missing `loading.tsx` files created

### Session 24 — Security & QA Sweep
- [x] `/api/metrics/quotes` admin-only auth (was public)
- [x] Rate limiting on auth routes (login 10/min, register 5/min)
- [x] 29 FK indexes (migration 068)
- [x] ~30 raw `<button>` → `Button` component, 4 inline Zod schemas centralized
- [x] 16 React Compiler setState-in-effect fixes

### Session 26 — Strategy & Compliance
- [x] Plan-based commission (basic 3%, pro/premium 1.5%)
- [x] Cookie "Reject All" + Sentry PII filtering + ROPA doc
- [x] DPAs signed (Supabase, Sentry, Vercel), GDPR cron deployed

### Session 27 — Architecture Restructure
- [x] `docs/ARCHITECTURE_REVIEW.md` (health 7.4/10)
- [x] `lib/ireland/`, `lib/data/`, `lib/stripe/client.ts` file moves
- [x] Barrel exports `components/ui/index.ts` (25 exports)
- [x] Husky + lint-staged pre-commit hooks
- [x] Frozen decisions FD-16→FD-22

### Session 28 — Agent Governance
- [x] CI workflow fixes, FD-23/FD-24/FD-25
- [x] Architecture audit (verified 10 claims, fixed 7)
- [x] Dependabot merge: supabase-js 2.97→2.98, stripe 20.3→20.4

### Session 29 — Doc Sync & Audit
- [x] CONTRIBUTING.md: fixed strict mode claim, migration number, Backstop references
- [x] PROJECT_CONTEXT.md: synced to session 29
- [x] Hardcoded `/en/` fix in earnings page (FD-11 compliance)
- [x] Backstop removed from CI, package.json, and visual-qa skill
- [x] Security best practices audit report generated

---

## 6. CURRENT STATE

- Migrations: ALL APPLIED in Supabase (check `marketplace/migrations/` for current count)
- Next migration: check highest existing number + 1
- Vercel deployment: active at `work-mate-neon.vercel.app`
- Stripe: test mode (`sk_test_*`) — Identity bypass in test, active on prod
- Email: 11 templates, guarded by `EMAIL_SEND_ENABLED` env var
- AI: guarded by `AI_CALLS_ENABLED` env var
- Master switch: `LIVE_SERVICES_ENABLED` controls all paid services (defined in `lib/live-services.ts`)
- All automated code work DONE. Security audit DONE. DPAs signed (Supabase, Sentry, Vercel).
- Design system COMPLETE (session 16, commit `51f69ce`). Zero hardcoded hex.
- Phase 1–4 features ALL COMPLETE (sessions 13–28).

---

## 7. REMAINING ACTIONS (Manual Only)

### Production go-live (5 items)
1. [ ] Supabase Pro — enable PITR backup in dashboard
2. [ ] Domain — purchase `workmate.ie` + connect to Vercel
3. [ ] Set `NEXT_PUBLIC_PLATFORM_BASE_URL` to production domain in Vercel env vars
4. [ ] Set `LIVE_SERVICES_ENABLED=true` in Vercel env vars (go-live day)
5. [ ] Supabase Auth — enable email confirmation + phone verification in dashboard

### Post-launch validation
6. [ ] UX testing — 3–5 real users
7. [ ] Responsive/browser testing — Safari, Firefox, mobile
8. [ ] Lighthouse manual run on production URL

### Future considerations (not blockers)
9. [ ] Notification push (SSE/websocket) — evaluate at 1K+ users
10. [ ] Cache layer (Redis or ISR) — evaluate for high-traffic pages
11. [ ] Mobile app — post-launch strategy decision
12. [ ] UK/Northern Ireland expansion — post-launch strategy decision

---

## 8. KNOWN ISSUES

- `pro/page.tsx` passes a `header` Card to Shell; `customer/page.tsx` does not — minor inconsistency, low priority
- Migrations `021_pro_documents_rls.sql` and `021_user_roles_multi_role.sql` both numbered 021 — both applied, cannot rename, doc-only
- `provider_rankings` materialized view empty in dev (no verified_pro test users) — ranking scores = 0 until real data

---

## 9. IMPORTANT DECISIONS

> **Canonical rules**: `ai-context/context/agents.md` (FD-01→FD-33).
> Below are project-specific facts not covered by frozen decisions.

- Quotes sorted: `ranking_score DESC` → `provider_matching_priority DESC` → `created_at DESC`
- Public API auth: `x-api-key` header → `profiles.api_key_hash` lookup (SHA-256 hash; plaintext column never created — see migration 060)

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

> **Ireland validation rules**: See `agents.md` sections 2.2 and 3.8 for canonical Eircode/phone rules.

- Provider docs: ID, Public Liability Insurance, Safe Pass, Tax Clearance (where applicable)
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

> Full details: `docs/PRODUCTION_LAUNCH.md` (5 phases)
> Most code-level items are DONE. Below are manual-only remaining actions.

### Go-live blockers (5 items)
1. [ ] Supabase Pro — enable PITR backup
2. [ ] Purchase `workmate.ie` domain + connect to Vercel
3. [ ] Set `NEXT_PUBLIC_PLATFORM_BASE_URL` to production domain
4. [ ] Set `LIVE_SERVICES_ENABLED=true` in Vercel env vars
5. [ ] Supabase Auth — enable email confirmation + phone verification

### Already completed (for reference)
- [x] All migrations applied (check `marketplace/migrations/` for current count)
- [x] Edge functions deployed (6 total)
- [x] DPAs signed (Supabase, Sentry, Vercel)
- [x] GDPR cron deployed + pg_cron scheduled
- [x] Security audit done (session 24: auth routes rate-limited, admin-only endpoints secured)
- [x] Sentry configured with PII filtering + tunnel route
- [x] CSP headers configured in `next.config.ts`
- [x] Rate limiting on auth routes (login, register, reset-password, guest-jobs)
- [x] RLS on all tables, 29 FK indexes added (migration 068)
- [x] Stripe Identity: bypassed in test, will be activated on production dashboard

---

## 14. REFERENCE

- Repo: `https://github.com/Oguzhanada/WorkMate`
- Supabase project: `ejpnmcxzycxqfdbetydp.supabase.co`
- Deployed: `work-mate-neon.vercel.app`
- Supabase docs: `https://supabase.com/docs`
- Stripe Connect docs: `https://stripe.com/docs/connect`

---

## 15. DATABASE GUARDRAILS (migration 081 audit — 2026-03-13)

The following rules are mandatory to prevent the issues identified in the pre-production DB audit from recurring. Use this as a checklist every time a migration is written.

### Function security
- Every `CREATE OR REPLACE FUNCTION` definition **must** include **`SET search_path = public, pg_catalog`**.
- This is especially critical for `SECURITY DEFINER` functions — omitting it creates a schema injection risk.

### RLS policy pattern
- Every policy created with `FOR ALL` **must** be restricted with **`TO <role>`** (e.g. `TO service_role`).
- Without a role restriction, `USING (true)` is exposed to all authenticated users — `FOR ALL USING (true)` is strictly forbidden (see IMPORTANT DECISIONS).

### Secret management
- **Never hardcode** Bearer tokens / API keys / secrets inside `cron.job`, migration files, or any SQL.
- All runtime secrets are stored in **Supabase Vault**; cron job commands read from `vault.decrypted_secrets`.
- Vault secret names: `cron_idv_secret` (id-verification), `cron_gdpr_secret` (gdpr-retention).

### Index design
- A corresponding **index** must be created in the same migration as every `FOREIGN KEY` (`CREATE INDEX IF NOT EXISTS idx_<table>_<column>`).
- Do **not** add btree indexes on boolean or low-cardinality columns (`true/false`, `bronze/silver/gold`, `open/closed`) — a sequential scan is always faster.

### Cron job management
- Before adding a new cron job, check existing schedules with **`SELECT * FROM cron.job`**.
- Never create more than one job calling the same function (nightly + hourly conflict).
- Create/remove jobs with `cron.schedule()` / `cron.unschedule()` — direct `UPDATE cron.job` table access does not work.

### Extension usage
- Use `extensions.unaccent()` in queries that require Irish name search (installed: migration 081).
- Use `extensions.similarity()` / `pg_trgm` operators for fuzzy text search (installed: migration 081).

### General checklist (after every migration)
```
[ ] New function → SET search_path added?
[ ] New RLS policy → TO <role> specified?
[ ] New FK → index created?
[ ] New secret → stored in Vault, not written to SQL?
[ ] New cron job → conflicts with existing schedule?
[ ] Boolean column → index NOT added?
```
