# WorkMate — Developer Guide

> Ireland-first services marketplace connecting customers with verified local professionals.

## Project Overview

WorkMate is a two-sided marketplace where customers post jobs (cleaning, plumbing, gardening, etc.) and verified providers submit quotes. The platform handles secure payments via Stripe Connect, provider verification (identity + Garda vetting), dispute resolution, and GDPR-compliant data management.

**Status:** Pre-production (deployed to Vercel test environment)
**Target market:** Republic of Ireland (26 counties, Eircode addressing)
**Language:** English-only across all surfaces

---

## Stack

| Layer          | Technology                                              |
|----------------|---------------------------------------------------------|
| Framework      | Next.js 16.1.6 (App Router, Turbopack)                 |
| UI             | React 19, Tailwind CSS v4, Framer Motion, @dnd-kit     |
| Language       | TypeScript (strict)                                     |
| Database       | Supabase PostgreSQL with Row Level Security (RLS)       |
| Auth           | Supabase Auth (Email/Password + Google/Facebook OAuth)  |
| Payments       | Stripe Connect (secure hold → capture/refund)           |
| Email          | Resend (transactional, `notifications@workmate.ie`)     |
| AI             | Anthropic Claude (job description writer)               |
| Error tracking | Sentry                                                  |
| Analytics      | Google Analytics 4 (cookie-consent gated)               |
| i18n           | next-intl (infrastructure ready, English content only)  |
| Validation     | Zod 4 + Ireland-specific validators                     |
| Testing        | Vitest (unit/integration), Playwright (E2E), BackstopJS (visual) |

---

## Folder Map

```
WorkMate/                         # Repository root
├── marketplace/                  # Application root (Next.js project)
│   ├── app/
│   │   ├── [locale]/             # All routed pages (locale-aware)
│   │   │   ├── dashboard/        # customer/ | pro/ | admin/ dashboards
│   │   │   ├── become-provider/  # Provider onboarding flow
│   │   │   ├── jobs/[jobId]/     # Job detail + collaboration
│   │   │   ├── find-services/    # Public service search + map
│   │   │   └── ...               # login, sign-up, profile, about, etc.
│   │   ├── api/                  # API route handlers
│   │   │   ├── health/           # Health check (public + admin detailed)
│   │   │   ├── jobs/             # Job CRUD + invoice creation
│   │   │   ├── connect/          # Stripe Connect (holds, captures, identity)
│   │   │   ├── admin/            # Admin operations (applications, risk, GDPR)
│   │   │   ├── webhooks/stripe/  # Stripe webhook handler
│   │   │   └── ...               # quotes, messages, reviews, categories, etc.
│   │   ├── actions/              # Server actions (offers, task-alerts)
│   │   └── og/                   # OG image generation route
│   ├── components/
│   │   ├── ui/                   # Design system primitives (Button, Card, Badge, etc.)
│   │   ├── dashboard/            # DashboardShell, WidgetGrid, widget cards
│   │   ├── forms/                # Multi-step forms (Job, Onboarding, Eircode)
│   │   ├── auth/                 # LoginForm, SignUpForm, BrandColumn
│   │   ├── search/               # MapView, SearchFilters, MapSearchView
│   │   ├── jobs/                 # TimeTracking, JobScheduler, Collaboration
│   │   └── offers/               # OfferCard, OfferRankingBadge
│   ├── lib/
│   │   ├── auth/rbac.ts          # Role-based access control
│   │   ├── supabase/             # 4 Supabase clients (browser, server, route, service)
│   │   ├── stripe/               # Stripe helpers and fee calculator
│   │   ├── email/                # Resend client, templates, send helper
│   │   ├── monitoring/           # Service health checks module
│   │   ├── rate-limit/           # In-memory sliding window rate limiter
│   │   ├── validation/           # Zod schemas (api.ts) + Ireland validators
│   │   ├── webhook/              # HMAC-SHA256 signed webhook delivery
│   │   ├── analytics/            # Funnel tracking (funnel_events)
│   │   ├── notifications/        # In-app notification sender
│   │   ├── live-services.ts      # Master switch for paid external services
│   │   └── ...                   # dashboard, jobs, ranking, pricing, etc.
│   ├── supabase/
│   │   ├── migrations/           # 001–072 (all applied)
│   │   └── functions/            # 6 edge functions (cron jobs)
│   ├── tests/
│   │   ├── unit/                 # Vitest unit tests
│   │   ├── integration/          # Vitest integration tests
│   │   ├── e2e/                  # Playwright E2E tests
│   │   └── setup/                # Test setup/fixtures
│   └── messages/en.json          # i18n strings
├── docs/                         # Architecture docs, checkpoints, runbooks
├── ai-context/                   # AI agent context files
├── scripts/                      # Utility scripts (MCP, deployment)
└── .github/workflows/            # CI: tests, CodeQL, Lighthouse, BackstopJS
```

---

## Core Business Flows

### 1. Job Lifecycle
1. Customer posts a job (multi-step form with category, description, budget, location)
2. Matching providers receive task alerts
3. Providers submit quotes (ranked by scoring algorithm)
4. Customer accepts a quote → Stripe secure hold created
5. Provider completes work → customer marks complete
6. Platform captures payment (with commission) → provider payout via Stripe Connect
7. Both parties can leave reviews

### 2. Provider Verification
1. User signs up as customer → requests provider access via onboarding form
2. Uploads: Insurance cert, tax clearance, trade qualification
3. Optional: Garda vetting self-service request
4. Admin reviews documents in verification queue
5. Approved → `verified_pro` role granted, can submit quotes

### 3. Payment Flow (Stripe Connect)
- `capture_method=manual` → secure hold on customer's card
- On job completion → platform captures the hold
- Commission deducted (plan-based: Basic 3%, Pro/Premium 1.5%)
- Net amount transferred to provider's connected Stripe account
- All amounts stored in cents (EUR, integer only)

### 4. Dispute Resolution
- Either party can open a dispute
- Evidence upload supported
- Admin arbitration with payment release/refund decision
- Stale disputes auto-escalated via edge function

---

## Supabase & RLS

### Client Selection Rules
| Context                        | Client                        | File                    |
|--------------------------------|-------------------------------|-------------------------|
| Client components (browser)    | `getSupabaseBrowserClient()`  | `lib/supabase/client.ts` |
| Server components (pages)      | `getSupabaseServerClient()`   | `lib/supabase/server.ts` |
| API route handlers             | `getSupabaseRouteClient()`    | `lib/supabase/route.ts`  |
| Admin ops / webhooks / cron    | `getSupabaseServiceClient()`  | `lib/supabase/service.ts` |

**Critical rules:**
- Never use a module-scope singleton on the server
- Service client bypasses ALL RLS — use only for admin/system operations
- RLS is never `FOR ALL USING (true)` — every table has explicit policies

### Key Tables
`profiles`, `user_roles`, `jobs`, `quotes`, `reviews`, `payments`, `pro_documents`, `pro_services`, `pro_service_areas`, `notifications`, `job_messages`, `disputes`, `categories`, `addresses`, `task_alerts`, `dashboard_widgets`, `funnel_events`, `job_contracts`, `provider_subscriptions`, `feature_flags`

### Migration Chain
- Files: `marketplace/supabase/migrations/001_*.sql` through `072_*.sql`
- All 72 migrations applied to production Supabase
- Next migration number: **073**
- Rule: never rewrite old migrations — additive only

---

## External Service Integrations

### Stripe Connect
- **Config:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID`
- **Webhook route:** `app/api/webhooks/stripe/route.ts`
- **Key files:** `lib/stripe/` (fee calculator, helpers)
- Test mode uses `sk_test_*` keys — safe for development

### Resend (Email)
- **Config:** `RESEND_API_KEY`
- **Files:** `lib/email/client.ts`, `lib/email/send.ts`, `lib/email/templates.ts`
- 11 email templates (quotes, contracts, vetting, GDPR, subscriptions)
- Dev guard: emails logged to console unless `EMAIL_SEND_ENABLED=true`

### Anthropic (AI)
- **Config:** `ANTHROPIC_API_KEY`
- Used for AI-powered job description writing
- Dev guard: returns 503 unless `AI_CALLS_ENABLED=true`

### Sentry
- **Config:** `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
- Error tracking + performance monitoring
- PII filtering configured (GDPR-compliant)

### Google Analytics 4
- **Config:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` (optional — omit to disable)
- Cookie-consent gated — no tracking fires before user consent

---

## Environment Variables

Copy `marketplace/.env.example` to `marketplace/.env.local` and fill in values:

| Variable                          | Required | Notes                                              |
|-----------------------------------|----------|----------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | Yes      | Supabase project URL                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Yes      | Supabase anonymous/public key                      |
| `SUPABASE_SERVICE_ROLE_KEY`       | Yes      | Supabase service role key (bypasses RLS)            |
| `STRIPE_SECRET_KEY`               | Yes      | Use `sk_test_*` for development                    |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes   | Use `pk_test_*` for development                    |
| `STRIPE_WEBHOOK_SECRET`           | Yes      | From Stripe webhook dashboard                      |
| `STRIPE_CONNECT_CLIENT_ID`        | Yes      | Stripe Connect platform client ID                  |
| `RESEND_API_KEY`                  | No       | Blocked in dev by default                          |
| `ANTHROPIC_API_KEY`               | No       | Blocked in dev by default                          |
| `SENTRY_DSN`                      | No       | Error tracking (recommended for staging/prod)      |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`   | No       | GA4 — omit to disable tracking entirely            |
| `LIVE_SERVICES_ENABLED`           | No       | Master switch — `true` in production only          |
| `EMAIL_SEND_ENABLED`              | No       | Dev override for Resend (never commit as `true`)   |
| `AI_CALLS_ENABLED`                | No       | Dev override for Anthropic (never commit as `true`)|
| `REQUIRE_GUEST_EMAIL_VERIFICATION`| No       | Guard for guest job submissions                    |
| `TASK_ALERT_SECRET`               | No       | HMAC secret for task alert cron                    |

### Live Services Master Switch
`LIVE_SERVICES_ENABLED` (defined in `lib/live-services.ts`) controls all paid external services. In development, all paid calls are blocked by default. Set to `true` in Vercel for production. Per-service overrides exist for isolated testing.

---

## Local Development Setup

```bash
# 1. Clone and install
git clone https://github.com/Oguzhanada/WorkMate.git
cd WorkMate/marketplace
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in Supabase + Stripe test keys

# 3. Run dev server
npm run dev          # Turbopack dev server at http://localhost:3000

# 4. Run tests
npm run test:unit       # Vitest unit tests
npm run test:integration # Vitest integration tests (needs dev server)
npm run test:e2e:smoke  # Playwright smoke tests
npm run test:e2e        # Full Playwright E2E suite

# 5. Other commands
npm run lint            # ESLint
npm run build           # Production build + next-sitemap
npm run preflight       # Pre-deploy checks
npm run health-check    # Hit /api/health
npm run test:visual     # BackstopJS visual regression
npm run test:visual:ref # Generate visual baselines
```

### E2E Test Credentials
For E2E tests that require login, set in `.env.local`:
```
E2E_CUSTOMER_EMAIL=customer@example.com
E2E_CUSTOMER_PASSWORD=<password>
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=<password>
```

---

## Deployment

- **Platform:** Vercel
- **Test environment:** `work-mate-neon.vercel.app`
- **Production domain:** `workmate.ie` (pending purchase + Vercel DNS)

### Pre-deploy Checklist
See `docs/PRODUCTION_LAUNCH.md` for the full 5-phase go-live checklist:
1. **Infrastructure** — Supabase Pro + PITR backup
2. **Environment** — All env vars set in Vercel
3. **DNS** — Domain + SSL
4. **Live services** — `LIVE_SERVICES_ENABLED=true`
5. **Monitoring** — Health checks, Sentry alerts, UptimeRobot

### Database Operations
See `docs/DB_RUNBOOK.md` for migration workflow, backup procedures, rollback, and emergency procedures.

---

## Design System

All UI uses `--wm-*` CSS custom properties defined in `app/globals.css`. No hardcoded hex values in component code.

| Token category | Examples                                           |
|----------------|----------------------------------------------------|
| Typography     | `--wm-font-display` (Syne), `--wm-font-sans` (Plus Jakarta Sans) |
| Colours        | `--wm-primary`, `--wm-navy`, `--wm-amber`, `--wm-destructive` |
| Surfaces       | `--wm-surface`, `--wm-bg`, `--wm-glass`           |
| Borders        | `--wm-border`, `--wm-border-soft`                  |
| Shadows        | `--wm-shadow-xs` through `--wm-shadow-2xl`         |
| Gradients      | `--wm-grad-primary`, `--wm-grad-navy`, `--wm-grad-hero` |
| Radii          | `--wm-radius-xs` through `--wm-radius-3xl`         |

### UI Primitives (`components/ui/`)
Button, Card, Badge, StatCard, PageHeader, Shell, EmptyState, Skeleton, ProgressBar, InfoTooltip, ComplianceBadge, GardaVettingBadge, FoundingProBadge, Input, Label, Spinner, FormField, Avatar, CookieConsent

### Frozen Rules
- All Zod schemas in `lib/validation/api.ts` — no inline schemas
- `loading.tsx` on every data-fetching page
- `Button` component always — no raw `<button>`
- `PageHeader` component for page tops — no raw `Card + h1`
- `EmptyState` for every list zero-state
- Responsive grid: `sm:grid-cols-2 lg:grid-cols-3` on card lists
- Money always in cents (`*_amount_cents`, EUR, integer)

---

## CI/CD Workflows

| Workflow                        | Trigger           | Purpose                              |
|---------------------------------|-------------------|--------------------------------------|
| `workmate-ci-tests.yml`        | Push / PR         | Unit + integration tests             |
| `workmate-english-only.yml`    | Push / PR         | Enforce English-only content          |
| `workmate-nightly-e2e.yml`     | Cron (nightly)    | Full E2E test suite                   |
| `codeql.yml`                   | Push / PR         | Security analysis (CodeQL)            |
| `lighthouse.yml`               | PR                | Performance audit                     |
| `backstop.yml`                 | PR                | Visual regression testing             |

---

## Edge Functions (Background Tasks)

| Function                     | Schedule   | Purpose                                      |
|------------------------------|------------|----------------------------------------------|
| `auto-release-payments`     | Periodic   | Auto-release held payments after completion   |
| `escalate-stale-disputes`   | Periodic   | Escalate unresolved disputes                  |
| `gdpr-retention-processor`  | Daily      | Process 30-day deletion holds + hard deletes  |
| `id-verification-retention` | Periodic   | Clean up expired ID verification data         |
| `match-task-alerts`         | Periodic   | Match new jobs to provider alert preferences  |
| `message-retention`         | Periodic   | Enforce message retention policies            |

---

## Known Technical Debt

1. **Rate limiter is in-memory** — resets on serverless cold start. Needs Redis/Vercel KV for distributed rate limiting across containers. See `lib/rate-limit/index.ts`.
2. **No middleware.ts** — auth and locale routing handled in page components. Consider adding Next.js middleware for centralized auth checks.
3. **Migration 045 overlap** — `045_api_keys.sql` was written but superseded by migration 060. Both exist but 060 is the active one.
4. **Migration 021 collision** — Two files share prefix 021 (pro_documents_rls + user_roles_multi_role). Both applied successfully.
5. **Dark mode** — CSS tokens lock to light theme even with `prefers-color-scheme: dark`. Intentional for now (light-first design).
6. **Manual testing needed** — Safari, Firefox, and mobile responsive testing not yet complete.
7. **Stripe MCP** — OAuth token may expire; only test mode operations are allowed via MCP.

---

## Key Documentation

| Document                            | Path                                          |
|-------------------------------------|-----------------------------------------------|
| Production launch checklist         | `docs/PRODUCTION_LAUNCH.md`                   |
| Database runbook                    | `docs/DB_RUNBOOK.md`                          |
| GDPR Record of Processing          | `docs/ROPA.md`                                |
| Architecture review                 | `docs/ARCHITECTURE_REVIEW.md`                 |
| Latest checkpoint                   | `docs/CHECKPOINT_SESSION26_2026-03-10.md`     |
| AI agent context                    | `ai-context/context/PROJECT_CONTEXT.md`       |
| Compliance rules                    | `ai-context/context/compliance-rules.md`      |
