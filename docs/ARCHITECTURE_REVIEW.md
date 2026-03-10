# WorkMate — Repository Architecture & DevOps Review

**Date:** 2026-03-10
**Scope:** Full codebase analysis — structure, patterns, CI/CD, scalability
**Evidence base:** 252 TSX/TS files, 105 API routes, 153 components, 74 migrations, 6 CI workflows

---

## 1) Executive Summary

### Overall Repository Health Score: **7.4 / 10**

WorkMate is a well-structured, production-approaching Next.js 16 application with strong foundations in validation, authentication, and operational documentation. The codebase demonstrates mature patterns (centralized Zod schemas, per-context Supabase clients, HMAC webhooks, live-service guards) that many production apps lack. The primary risks are organizational — scattered constants, thin type/hook layers, inconsistent error handling — rather than architectural. These are low-risk, high-reward fixes.

### Top 5 Strengths

| # | Strength | Evidence |
|---|----------|----------|
| 1 | **Centralized validation** | 60+ Zod schemas in `lib/validation/api.ts`, used across all 105 API routes |
| 2 | **Perfect loading-state coverage** | Every one of 54 pages has a corresponding `loading.tsx` — zero blank-screen navigations |
| 3 | **Mature CI/CD pipeline** | 6 GitHub Actions workflows: lint, typecheck, unit/integration/E2E, BackstopJS visual regression, Lighthouse CI, CodeQL security |
| 4 | **Supabase client separation** | 4 purpose-built clients (browser/server/route/service-role), no module-scope singletons on server |
| 5 | **Comprehensive live-service guards** | Master `LIVE_SERVICES_ENABLED` switch + per-service overrides prevent any paid API calls in development |

### Top 5 Structural Risks

| # | Risk | Impact | Severity |
|---|------|--------|----------|
| 1 | **No `next/image` usage anywhere** | No AVIF/WebP optimization, no lazy loading, no CLS protection — raw `<img>` tags throughout | P1 |
| 2 | **~55 API routes use raw `NextResponse.json` instead of centralized error helpers** | Inconsistent error schema for clients, harder monitoring/alerting | P1 |
| 3 | **No pre-commit hooks (Husky/lint-staged)** | All quality gates only run in CI — broken code can be committed locally | P1 |
| 4 | **`lib/` root has 11 orphaned files** + types/hooks/constants severely underpopulated | Growing cognitive load, unclear ownership boundaries | P2 |
| 5 | **TypeScript `strict: false`** | Implicit `any` allowed — type safety gap that grows with codebase size | P2 |

---

## 2) Current Repository Assessment

### 2.1 App Router Organization

**Structure:** `app/[locale]/` wraps all user-facing routes; `app/api/` is locale-agnostic.

| Metric | Count | Status |
|--------|-------|--------|
| `page.tsx` | 54 | Comprehensive |
| `layout.tsx` | 18 | Strategic (auth, dashboard, admin, multi-step flows) |
| `loading.tsx` | 54 | **Perfect** — 1:1 with pages |
| `error.tsx` | 8 | Good — covers dashboard, jobs, profile, admin |
| `not-found.tsx` | 2 | Root + locale level |
| `route.ts` (API) | 105 | Well-organized by domain |

**Strengths:**
- Clean locale wrapping: all pages under `[locale]/`, API routes outside
- Dashboard hierarchy: `/dashboard/customer`, `/dashboard/pro`, `/dashboard/admin`
- Public API namespace: `/api/public/v1/` properly separated
- Server actions limited to 2 files (`app/actions/offers.ts`, `app/actions/task-alerts.ts`)

**Weaknesses:**
- **No route groups** — Auth pages (`login`, `sign-up`, `forgot-password`, `reset-password`) are flat siblings rather than grouped under `(auth)`. Static/legal pages (`about`, `terms`, `privacy`, `faq`, etc.) similarly ungrouped.
- **Inconsistent URL parameter naming** — `[jobId]` vs `[id]` vs `[profileId]` across routes. API uses `[id]` for disputes/notifications but `[jobId]` for jobs.
- **Duplicate privacy pages** — Both `/privacy` and `/privacy-policy` exist under `[locale]/`.
- **`checkout/` lives outside `[locale]/`** — `app/checkout/success/` and `app/checkout/cancel/` bypass locale wrapping.

### 2.2 Reusability Boundaries

**`components/` — 153 files across 19 directories:**

| Directory | Files | Role |
|-----------|-------|------|
| `ui/` | 25 | Design system primitives (Button, Card, Badge, Input, etc.) |
| `dashboard/` | 21 | Dashboard panels + `widgets/` (14 widget implementations) |
| `profile/` | 18 | User profile sections |
| `home/` | 14 | Landing page sections |
| `auth/` | 10 | Authentication forms |
| `jobs/` | 8 | Job-related UI |
| `forms/` | 7 | Multi-step forms |
| `site/` | 6 | Navbar, Footer, global layout |
| Others | 44 | search, providers, offers, disputes, payments, etc. |

**Strengths:**
- `ui/` primitives are well-isolated and reused consistently
- Feature-based directory organization (jobs, profile, disputes) is clear
- Dashboard widgets have their own nested structure

**Weaknesses:**
- **No barrel exports** (`index.ts`) in any component directory — every import requires full path
- **Cross-domain leakage in `dashboard/`** — `QuoteActions.tsx` (offers domain), `LeaveReviewForm.tsx` (reviews domain), `JobMessagePanel.tsx` (messaging domain) all live under `dashboard/` instead of their feature directories
- **Forms directory is domain-agnostic** — `JobMultiStepForm`, `ProOnboardingForm`, `GuestJobIntentForm` bundled together regardless of domain

**`lib/` — 45 files across 22 subdirectories + 11 root-level files:**

| Concern | Status |
|---------|--------|
| Supabase clients (`lib/supabase/`) | **Excellent** — 4 context-specific clients |
| Validation (`lib/validation/`) | **Excellent** — centralized, 748-line schema hub |
| Email (`lib/email/`) | **Good** — client, send, templates |
| Rate limiting (`lib/rate-limit/`) | **Good** — middleware wrapper + 7 presets |
| Auth/RBAC (`lib/auth/`) | **Good** — admin guard + helpers |
| Webhooks (`lib/webhook/`) | **Good** — HMAC signing + retries |
| Hooks (`lib/hooks/`) | **Weak** — only 1 hook (`useCategoriesWithFallback`) |
| Types (`lib/types/`) | **Weak** — only 1 file (`airtasker.ts`) |
| Constants (`lib/constants/`) | **Weak** — only `job.ts`, while 6+ constant files sit at `lib/` root |

**11 orphaned root-level files in `lib/`:**
`animations.ts`, `disputes.ts`, `eircode.ts`, `i18n.ts`, `ireland-coordinates.ts`, `ireland-locations.ts`, `live-services.ts`, `marketplace-data.ts`, `provider-documents.ts`, `service-taxonomy.ts`, `stripe.ts`

These lack a home directory and increase cognitive load. Most should move to `lib/constants/`, `lib/data/`, or domain-specific subdirectories.

### 2.3 API Layer Quality

**98 unique API route files, 105 endpoints across HTTP methods:**

| Pattern | Coverage | Notes |
|---------|----------|-------|
| Zod validation | **100%** | All routes validate via `lib/validation/api.ts` |
| Auth checks | **88%** (86/98) | Exempt: health, categories, address-lookup (correct) |
| `ensureAdminRoute()` | **100%** of admin routes | Consistent RBAC guard |
| Rate limiting | **47%** (46/98) | All writes protected; many GET admin routes unprotected |
| Centralized error helpers | **~45%** | ~55 routes use raw `NextResponse.json({ error })` |
| Audit logging | **100%** of admin writes | `logAdminAudit()` on all mutations |
| Webhook idempotency | **Yes** | `webhook_events` table with unique constraint |

**Key issues:**
1. **Inconsistent error responses** — Some routes return `.flatten()`, others `.issues` for validation errors. Some use `apiError()`, others use raw `NextResponse.json`.
2. **Error message leakage** — A few routes expose `error.message` directly (e.g., `categories/[categoryId]/price-estimate/route.ts:27`).
3. **GET admin routes unprotected by rate limiting** — `/api/admin/analytics`, `/api/admin/feature-flags`, `/api/admin/pending-jobs` lack `withRateLimit()`.

### 2.4 Infrastructure & Ops Posture

**CI/CD — 6 workflows (`.github/workflows/`):**

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `workmate-ci-tests.yml` | PR + push to main | Lint, typecheck, unit/integration/E2E smoke |
| `backstop.yml` | PR | Visual regression (6 scenarios × 3 viewports) |
| `lighthouse.yml` | PR | Performance 0.7, a11y/SEO/best-practices 0.8 |
| `codeql.yml` | Push | GitHub security analysis |
| `workmate-english-only.yml` | PR + push | UI string validation |
| `workmate-nightly-e2e.yml` | Nightly cron | Full E2E suite (all browsers) |

**Scripts (`marketplace/scripts/`) — 9 files:**
`preflight.mjs`, `health-check.mjs`, `check-english-only.mjs`, `check-pr-guardrails.ps1`, `pre-public-security-check.mjs`, `cleanup-non-admin.mjs`, `run-provider-customer-e2e-flow.mjs`, `test-provider-scheduling-api-flow.mjs`, `test-time-tracking-api-flow.mjs`

**Docs (`docs/`) — 16 files:**
Production launch, ROPA, DB runbook, 4 checkpoint files, strategy reports, user guide, branch recovery. Well-maintained operational documentation.

**Gaps:**
- No `LICENSE` file at repo root
- No `CODE_OF_CONDUCT.md`
- No `SECURITY.md` (vulnerability disclosure policy)
- No `Dockerfile` / `docker-compose.yml` (Vercel-only deployment)
- No `vercel.json` (relies on Next.js conventions — acceptable but explicit config preferred)

### 2.5 Gaps, Redundancies, and Misplaced Responsibilities

| Issue | Location | Type |
|-------|----------|------|
| Duplicate privacy pages | `app/[locale]/privacy/` + `app/[locale]/privacy-policy/` | Redundancy |
| `checkout/` outside locale | `app/checkout/{success,cancel}/` | Misplacement |
| Dashboard components doing cross-domain work | `dashboard/QuoteActions`, `dashboard/LeaveReviewForm`, `dashboard/JobMessagePanel` | Misplacement |
| Ireland data files at lib root | `lib/ireland-coordinates.ts`, `lib/ireland-locations.ts`, `lib/eircode.ts` | Disorganization |
| Constants scattered | `lib/marketplace-data.ts`, `lib/service-taxonomy.ts`, `lib/provider-documents.ts` in root | Disorganization |
| `styles/` directory contains only `animations.ts` | `marketplace/styles/` | Misleading |
| `marketplace/migrations/` separate from `supabase/` | Migrations not co-located with Supabase config | Convention mismatch |
| `lib/validation/api.ts` at 748 lines | Single monolithic file for all schemas | Scalability risk |

---

## 3) Target Folder Architecture

```
marketplace/
├── app/
│   ├── layout.tsx                          # Root layout (fonts, providers, Sentry)
│   ├── global-error.tsx                    # Global error boundary
│   ├── not-found.tsx                       # Root 404
│   ├── manifest.ts                         # PWA manifest
│   ├── robots.ts                           # robots.txt
│   ├── sitemap.ts                          # sitemap.xml
│   ├── globals.css                         # Global styles + --wm-* tokens
│   ├── tokens.css                          # Design tokens
│   │
│   ├── (auth)/                             # Route group: auth flows (shared layout)
│   │   ├── layout.tsx                      # Centered card layout
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   │
│   ├── (checkout)/                         # Route group: Stripe checkout
│   │   ├── checkout/success/
│   │   └── checkout/cancel/
│   │
│   ├── [locale]/
│   │   ├── layout.tsx                      # Locale wrapper (Navbar, Footer, intl)
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── page.tsx                        # Home
│   │   │
│   │   ├── (marketing)/                    # Route group: static/legal pages
│   │   │   ├── about/
│   │   │   ├── blog/
│   │   │   ├── contact/
│   │   │   ├── faq/
│   │   │   ├── how-it-works/
│   │   │   ├── pricing/
│   │   │   ├── privacy/                    # Consolidate privacy + privacy-policy
│   │   │   ├── terms/
│   │   │   ├── cookie-policy/
│   │   │   ├── data-retention/
│   │   │   └── community-guidelines/
│   │   │
│   │   ├── (marketplace)/                  # Route group: discovery
│   │   │   ├── find-services/
│   │   │   ├── search/
│   │   │   ├── providers/
│   │   │   ├── jobs/
│   │   │   ├── service/[slug]/
│   │   │   ├── saved-searches/
│   │   │   └── saved-providers/
│   │   │
│   │   ├── (provider)/                     # Route group: provider flows
│   │   │   ├── become-provider/
│   │   │   ├── founding-pro/
│   │   │   └── garda-vetting/
│   │   │
│   │   ├── post-job/                       # Job posting flow
│   │   │
│   │   ├── dashboard/                      # Protected — RBAC in layout
│   │   │   ├── layout.tsx                  # Auth guard + sidebar
│   │   │   ├── page.tsx                    # Role-based redirect
│   │   │   ├── customer/
│   │   │   ├── pro/
│   │   │   │   └── earnings/
│   │   │   ├── appointments/
│   │   │   ├── disputes/
│   │   │   │   └── [id]/
│   │   │   └── admin/                      # Admin-only guard in layout
│   │   │       ├── analytics/
│   │   │       ├── applications/[id]/
│   │   │       ├── audit-logs/
│   │   │       ├── garda-vetting/
│   │   │       ├── gdpr/
│   │   │       ├── risk/
│   │   │       ├── stats/
│   │   │       └── verification/
│   │   │
│   │   ├── profile/
│   │   │   └── public/[id]/
│   │   ├── account/settings/
│   │   ├── messages/
│   │   └── notifications/
│   │
│   ├── actions/                            # Server Actions
│   │   ├── offers.ts
│   │   └── task-alerts.ts
│   │
│   ├── api/                                # API routes (unchanged — well-organized)
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── connect/
│   │   ├── jobs/
│   │   ├── disputes/
│   │   ├── public/v1/
│   │   ├── webhooks/
│   │   └── ... (other domains)
│   │
│   └── og/                                 # OG image generation
│
├── components/
│   ├── ui/                                 # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── ... (25 primitives)
│   │   └── index.ts                        # Barrel export
│   │
│   ├── layout/                             # App-wide layout components
│   │   ├── Navbar.tsx                      # ← from site/
│   │   ├── Footer.tsx                      # ← from site/
│   │   ├── Shell.tsx                       # ← from ui/
│   │   ├── PageHeader.tsx                  # ← from ui/
│   │   └── index.ts
│   │
│   ├── forms/                              # Shared form primitives
│   │   ├── FormField.tsx
│   │   └── FormSection.tsx
│   │
│   ├── seo/                                # SEO components
│   │   └── JsonLd.tsx
│   │
│   ├── auth/                               # Auth feature components
│   ├── home/                               # Landing page sections
│   ├── dashboard/                          # Dashboard panels & widgets
│   │   └── widgets/
│   ├── jobs/                               # Job feature components
│   │   ├── JobMultiStepForm.tsx            # ← from forms/
│   │   ├── JobContractPanel.tsx
│   │   ├── JobScheduler.tsx
│   │   ├── JobMessagePanel.tsx             # ← from dashboard/
│   │   └── JobPhotoUploader.tsx            # ← from dashboard/
│   ├── profile/                            # Profile feature components
│   ├── providers/                          # Provider feature components
│   │   └── ProOnboardingForm.tsx           # ← from forms/
│   ├── search/                             # Search/map components
│   ├── offers/                             # Offer/quote components
│   │   └── QuoteActions.tsx                # ← from dashboard/
│   ├── disputes/                           # Dispute components
│   ├── payments/                           # Payment flow components
│   ├── reviews/                            # Review components
│   │   └── LeaveReviewForm.tsx             # ← from dashboard/
│   ├── appointments/                       # Appointment components
│   ├── notifications/                      # Notification bell
│   └── account/                            # GDPR, settings
│
├── lib/
│   ├── config/                             # NEW — centralized env var access
│   │   └── env.ts                          # Single source for all process.env reads
│   │
│   ├── supabase/                           # Supabase clients (unchanged — excellent)
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── route.ts
│   │   └── service.ts
│   │
│   ├── stripe/                             # Stripe (rename from root stripe.ts)
│   │   └── client.ts
│   │
│   ├── email/                              # Resend (unchanged)
│   │   ├── client.ts
│   │   ├── send.ts
│   │   └── templates.ts
│   │
│   ├── validation/                         # Zod schemas (split from monolith)
│   │   ├── auth.ts                         # Auth schemas
│   │   ├── jobs.ts                         # Job/quote schemas
│   │   ├── admin.ts                        # Admin schemas
│   │   ├── disputes.ts                     # Dispute schemas
│   │   ├── profile.ts                      # Profile schemas
│   │   ├── payments.ts                     # Stripe/payment schemas
│   │   ├── common.ts                       # Shared types (IrishCounty, etc.)
│   │   └── index.ts                        # Re-export all
│   │
│   ├── auth/                               # RBAC, admin helpers (unchanged)
│   ├── api/                                # Error response helpers (unchanged)
│   ├── rate-limit/                         # Rate limiting (unchanged)
│   ├── webhook/                            # HMAC signing (unchanged)
│   ├── notifications/                      # sendNotification (unchanged)
│   ├── analytics/                          # Funnel tracking (unchanged)
│   ├── flags/                              # Feature flags (unchanged)
│   │
│   ├── ireland/                            # NEW — Ireland-specific domain logic
│   │   ├── eircode.ts                      # ← from lib/eircode.ts
│   │   ├── coordinates.ts                  # ← from lib/ireland-coordinates.ts
│   │   ├── locations.ts                    # ← from lib/ireland-locations.ts
│   │   └── phone.ts                        # ← from lib/validation/phone.ts
│   │
│   ├── data/                               # NEW — static data / enums
│   │   ├── categories.ts                   # ← from lib/marketplace-data.ts
│   │   ├── services.ts                     # ← from lib/service-taxonomy.ts
│   │   ├── documents.ts                    # ← from lib/provider-documents.ts
│   │   └── budgets.ts                      # ← from lib/constants/job.ts
│   │
│   ├── hooks/                              # Custom React hooks (populate!)
│   │   ├── useCategoriesWithFallback.ts
│   │   ├── useSupabaseAuth.ts              # Extract from components
│   │   ├── useDebounce.ts                  # Extract from search
│   │   └── useMediaQuery.ts                # Extract from responsive logic
│   │
│   ├── types/                              # Shared TypeScript types (populate!)
│   │   ├── database.ts                     # Supabase-generated types
│   │   ├── api.ts                          # API response/request types
│   │   ├── domain.ts                       # Business domain types
│   │   └── index.ts                        # Re-export all
│   │
│   ├── animations/                         # Framer Motion configs
│   │   └── index.ts                        # ← from lib/animations.ts
│   │
│   ├── pricing/                            # Fee calculator (unchanged)
│   ├── ranking/                            # Offer ranking (unchanged)
│   ├── profile/                            # Completeness scoring (unchanged)
│   ├── jobs/                               # Job access control (unchanged)
│   ├── onboarding/                         # Provider verification (unchanged)
│   ├── dashboard/                          # Widget config (unchanged)
│   ├── automation/                         # Automation engine (unchanged)
│   ├── admin/                              # Audit logging (unchanged)
│   ├── i18n/                               # Locale helpers (unchanged)
│   └── live-services.ts                    # Master switch (stays at root — critical)
│
├── hooks/                                  # ALTERNATIVE: top-level hooks dir
│                                           # (if team prefers hooks outside lib/)
│
├── types/                                  # ALTERNATIVE: top-level types dir
│
├── i18n/                                   # next-intl configuration
│   ├── config.ts
│   └── request.ts
│
├── messages/                               # Translation files
│   └── en.json
│
├── styles/                                 # Global stylesheets only
│   └── (empty or move animations out)
│
├── supabase/                               # Supabase project config
│   ├── config.toml
│   └── functions/                          # 6 edge functions
│       ├── auto-release-payments/
│       ├── escalate-stale-disputes/
│       ├── gdpr-retention-processor/
│       ├── id-verification-retention/
│       ├── match-task-alerts/
│       └── message-retention/
│
├── migrations/                             # SQL migrations (001–073)
│
├── tests/
│   ├── unit/                               # Vitest unit tests
│   ├── integration/                        # Vitest integration tests
│   ├── e2e/
│   │   └── smoke/                          # Playwright smoke tests
│   └── setup/                              # Test setup (MSW, vitest config)
│
├── scripts/                                # Build/ops scripts
│   ├── preflight.mjs
│   ├── health-check.mjs
│   ├── check-english-only.mjs
│   └── ...
│
├── public/                                 # Static assets
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.mjs
└── .env.example
```

### Folder Ownership Rules

| Folder | Owner | Rule |
|--------|-------|------|
| `components/ui/` | Design system | Primitives only — no business logic, no data fetching |
| `components/layout/` | App shell | Navbar, Footer, Shell, PageHeader — global layout only |
| `components/{feature}/` | Feature team | Domain-specific UI — may import from `ui/` and `lib/` |
| `lib/supabase/` | Platform | Client creation only — no business queries |
| `lib/validation/` | API contracts | Zod schemas only — imported by routes and forms |
| `lib/ireland/` | Domain | Ireland-specific logic (Eircode, phone, coordinates) |
| `lib/data/` | Constants | Static enums, categories, configuration — no runtime logic |
| `lib/hooks/` | Shared | Reusable React hooks — no component-specific hooks |
| `lib/types/` | Contracts | Shared type definitions — source of truth for TS interfaces |
| `lib/config/` | Platform | Environment variable access — single source of truth |
| `app/api/` | Backend | Route handlers — validation → auth → business logic → response |
| `tests/` | Quality | Test files only — mirrors source structure by test type |

---

## 4) WorkMate-Specific Architecture Recommendations

### 4.1 i18n Strategy

**Current state:** next-intl v4 with `app/[locale]/` wrapping. English only. `i18n/config.ts` + `messages/en.json` + `lib/i18n/locale-path.ts` utilities.

**Assessment:** Well-implemented for single locale. The `[locale]` param is future-proof for adding Irish (ga) or other languages.

**Recommendations:**

| # | Action | Effort | Priority |
|---|--------|--------|----------|
| 1 | Keep `[locale]` wrapper even for English-only — removing it later is harder than keeping it | — | — |
| 2 | Move `checkout/` routes under `[locale]` to prevent locale-stripping on Stripe redirects | S | P1 |
| 3 | Ensure all `redirect()` calls use `getLocaleRoot()` (audit for any raw `/dashboard` redirects) | S | P1 |
| 4 | Keep `messages/en.json` as the single translation file — do NOT split by page until you add a second locale | — | — |

### 4.2 Supabase Client Separation

**Current state:** 4 clients in `lib/supabase/` — browser, server, route, service-role. All follow correct instantiation patterns (no server-side singletons).

**Assessment:** **Excellent.** This is better than most production apps. No changes needed.

| Client | File | When to Use |
|--------|------|-------------|
| `createBrowserClient()` | `client.ts` | Client components, browser-only code |
| `createServerClient()` | `server.ts` | Server components (read-only cookies) |
| `createServerClient()` | `route.ts` | API route handlers (read/write cookies) |
| `createClient()` | `service.ts` | Admin ops, cron jobs, webhooks (bypasses RLS) |

**One improvement:** Add a JSDoc comment to each file explaining when to use it — this is the #1 question new contributors will have.

### 4.3 Stripe Connect and Webhook Boundaries

**Current state:**
- `lib/stripe.ts` — module-scope singleton (`const stripe = new Stripe(...)`)
- `app/api/connect/` — 5 routes for account links, identity verification, payments
- `app/api/webhooks/stripe/route.ts` — 543-line handler for 10+ event types
- Idempotency via `webhook_events` table

**Recommendations:**

| # | Action | Effort | Priority |
|---|--------|--------|----------|
| 1 | Move `lib/stripe.ts` → `lib/stripe/client.ts` for consistency with other integrations | S | P2 |
| 2 | Split `webhooks/stripe/route.ts` into handler functions per event type in `lib/stripe/handlers/` | M | P2 |
| 3 | The module-scope Stripe singleton is acceptable for a stateless SDK — no functional change needed | — | — |

**Proposed structure:**
```
lib/stripe/
├── client.ts                    # Stripe SDK instance
└── handlers/                    # Webhook event handlers
    ├── payment-intent.ts
    ├── subscription.ts
    ├── invoice.ts
    ├── identity.ts
    ├── dispute.ts
    └── account.ts
```

This keeps the webhook route handler under 50 lines (dispatch only) while each handler owns its domain logic.

### 4.4 Ireland-Specific Domain Logic Module

**Current state:** Ireland logic is scattered across `lib/` root:
- `lib/eircode.ts` — Eircode validation
- `lib/ireland-coordinates.ts` — County GPS coordinates
- `lib/ireland-locations.ts` — Locality/county mappings
- `lib/validation/phone.ts` — Irish phone normalization
- `lib/validation/api.ts` — `IrishCounty` type, county enum

**Recommendation:** Create `lib/ireland/` as a domain module:

```
lib/ireland/
├── eircode.ts          # Eircode validation & formatting
├── phone.ts            # Irish phone normalization (+353)
├── coordinates.ts      # County GPS data (31 counties)
├── locations.ts        # Locality/county mappings
├── counties.ts         # IrishCounty type + county list enum
├── vat.ts              # Future: VAT validation for businesses
└── index.ts            # Barrel export
```

**Why:** Ireland-specific logic is a core differentiator. Grouping it makes the domain expertise visible, testable, and extendable (e.g., adding Revenue integration for tax, or PSC verification for identity).

### 4.5 Admin Area Structure

**Current state:** Admin routes live under `app/[locale]/dashboard/admin/` with `ensureAdminRoute()` guards on API routes. No separate route group or layout-level guard.

**Recommendations:**

| # | Action | Effort | Priority |
|---|--------|--------|----------|
| 1 | Add an `admin/layout.tsx` that checks admin role and redirects non-admins — defense in depth beyond API guards | S | P1 |
| 2 | Keep admin under `/dashboard/admin/` (not a separate route group) — the URL hierarchy is correct for a marketplace where admins also use customer/provider views | — | — |
| 3 | Consider `(admin)` route group only if admin gets its own sidebar/nav — not needed today | — | P3 |

---

## 5) Git/GitHub and Delivery Standards

### 5.1 `.gitignore` Checklist

**Current coverage (✅ = present, ❌ = missing):**

| Entry | Status | Notes |
|-------|--------|-------|
| `node_modules/` | ✅ | |
| `.next/` | ✅ | |
| `.env`, `.env.local`, `.env.*.local` | ✅ | Only `.env.example` committed |
| `coverage/` | ✅ | Vitest coverage output |
| `test-results/`, `playwright-report/` | ✅ | |
| `backstop_data/bitmaps_test/` | ✅ | Visual regression test output |
| `.sentryclirc` | ✅ | |
| `.mcp.json` | ✅ | Contains secrets |
| `docs/legal/` | ✅ | DPAs, contracts |
| `.DS_Store`, `Thumbs.db` | ✅ | |
| `*.log` | ✅ | |
| `.venv/` | ✅ | Python virtualenv |
| `*.pem`, `*.key` | ❌ | **Add** — prevent accidental cert commits |
| `*.p12`, `*.pfx` | ❌ | **Add** — certificate bundles |
| `.vercel/` | ❌ | **Add** — Vercel CLI local cache |
| `.turbo/` | ❌ | **Add** — Turbopack cache |
| `tsconfig.tsbuildinfo` | ✅ | |

### 5.2 Required Root Documents

| Document | Status | Should Contain |
|----------|--------|----------------|
| `README.md` | ✅ (in `marketplace/`) | Project overview, setup, architecture summary — **move or symlink to repo root** |
| `CONTRIBUTING.md` | ✅ (at root) | Setup, standards, PR process, Ireland rules — **comprehensive, well-written** |
| `LICENSE` | ❌ **Missing** | Choose license (proprietary recommended for marketplace IP) |
| `SECURITY.md` | ❌ **Missing** | Vulnerability disclosure policy, responsible reporting contact |
| `CODE_OF_CONDUCT.md` | ❌ **Missing** | Standard Contributor Covenant or custom |
| `.github/pull_request_template.md` | ✅ | Checklist: lint, tests, English, security, UI regression |
| `.github/dependabot.yml` | ✅ | Weekly npm updates, 2 groups |

### 5.3 Branching Model

**For solo developer (current):**
```
main (production-ready) ← feature/* branches
```

**Team-ready evolution:**
```
main (production)
├── develop (integration)
│   ├── feature/* (new features)
│   ├── fix/* (bug fixes)
│   └── chore/* (maintenance)
└── release/* (staging candidates)
    └── hotfix/* (emergency production fixes)
```

**Rules:**
- `main` is always deployable — enforce with branch protection (require CI pass + 1 review)
- Feature branches: `feature/WM-{ticket}-short-description`
- Squash-merge to `develop`, merge commit to `main`
- Hotfixes branch from `main`, merge back to both `main` and `develop`

### 5.4 GitHub Actions Baseline

**Current (6 workflows) — already exceeds baseline. Improvement opportunities:**

| Workflow | Current | Recommendation |
|----------|---------|----------------|
| Lint + typecheck | ✅ `npm run lint` | Add `--strict` flag progressively |
| Unit/integration tests | ✅ `npm run test` | Add coverage threshold gate (70%) |
| E2E smoke | ✅ Playwright chromium | Add Firefox in nightly, keep smoke fast |
| Visual regression | ✅ BackstopJS 3 viewports | Consider adding new scenarios as pages grow |
| Performance | ✅ Lighthouse CI | Add bundle size check (`@next/bundle-analyzer`) |
| Security | ✅ CodeQL | Add `npm audit --audit-level=high` step |
| Deploy gate | ❌ Missing | Add Vercel preview deploy + comment URL on PR |

---

## 6) Local Development and Environment Management

### 6.1 Setup Documentation Flow

**Current:** `CONTRIBUTING.md` covers setup. `marketplace/README.md` has overview. `scripts/preflight.mjs` validates environment.

**Recommended setup flow (document in README):**

```
1. git clone → cd marketplace
2. cp .env.example .env.local      # Fill in Supabase + Stripe test keys
3. npm install
4. npm run preflight               # Validates env vars + service connectivity
5. npm run dev                     # Turbopack on localhost:3000
6. npm run test                    # Verify tests pass
```

### 6.2 Environment Variable Strategy

**Current state:** `.env.example` documents 15+ vars. `.env.local` is gitignored. No `.env.production` checked in.

| File | Purpose | Committed? |
|------|---------|------------|
| `.env.example` | Template with dummy values + descriptions | ✅ Yes |
| `.env.local` | Developer's real keys (Supabase, Stripe test) | ❌ Gitignored |
| `.env.test` | Test-specific overrides (if needed) | ❌ Gitignored |
| Vercel env vars | Production secrets | N/A (Vercel dashboard) |

**Recommendation:** Add a `lib/config/env.ts` that centralizes all `process.env` access:

```typescript
// lib/config/env.ts
function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  supabase: {
    url: required('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },
  stripe: {
    secretKey: required('STRIPE_SECRET_KEY'),
    publishableKey: required('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    webhookSecret: required('STRIPE_WEBHOOK_SECRET'),
    connectClientId: required('STRIPE_CONNECT_CLIENT_ID'),
  },
  // ... etc
} as const;
```

**Why:** Currently 8 files access `process.env` directly. A centralized config provides: (a) fail-fast on missing vars, (b) single source of truth, (c) TypeScript autocomplete, (d) easier testing/mocking.

### 6.3 Migration/Seed Workflow

**Current:** 74 migrations in `marketplace/migrations/`, additive-only policy, applied via Supabase MCP.

**Documented workflow (in `docs/DB_RUNBOOK.md`):**
1. Create migration file: `{NNN}_{description}.sql` (next = 073)
2. Apply via `mcp__supabase__apply_migration` or `supabase db push`
3. Never modify applied migrations
4. Seed data: `scripts/` contains seed helpers

**Recommendation:** This is solid. One improvement: add a `npm run migrate:status` script that checks which migrations have been applied vs pending.

### 6.4 External Service Toggles

**Current implementation — excellent:**

| Service | Dev Default | Guard | Override |
|---------|-------------|-------|----------|
| Stripe | `sk_test_*` | None needed (test mode) | — |
| Resend | Blocked | `liveServices.email` | `EMAIL_SEND_ENABLED=true` |
| Anthropic AI | Blocked | `liveServices.ai` | `AI_CALLS_ENABLED=true` |
| Supabase | Free tier | None needed | — |

**`lib/live-services.ts`** is the master switch — well-implemented, no changes needed.

---

## 7) Scalability and Maintainability Path

### 7.1 Folder Evolution Strategy

**Current state:** Feature-based component directories work well at 153 components. At 300+ components, consider:

| Component Count | Strategy |
|-----------------|----------|
| < 200 (current) | Feature directories (`components/jobs/`, `components/profile/`) |
| 200–500 | Add barrel exports, split large components into sub-files |
| 500+ | Consider domain modules (`modules/jobs/components/`, `modules/jobs/lib/`, `modules/jobs/types/`) |

**Key signal to restructure:** When a developer needs to touch 4+ directories to add one feature, it's time for domain modules.

### 7.2 Domain-Driven vs Feature-Based Tradeoffs

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Feature-based** (current) | Simple, flat, easy onboarding | Cross-cutting concerns get messy | < 500 components, small team |
| **Domain-driven** (`modules/`) | Strong boundaries, independent deployment | Higher initial complexity, more boilerplate | 500+ components, 3+ developers |

**Recommendation for WorkMate:** Stay feature-based. Your current 153 components across 19 directories is well within the comfortable range. Create `lib/ireland/` as a domain module (it's a genuine bounded context), but don't restructure the whole codebase into `modules/`.

### 7.3 Anti-Duplication Patterns

| Pattern | Current State | Recommendation |
|---------|---------------|----------------|
| **Zod schemas** | Centralized in `lib/validation/` | ✅ Keep — split into domain files when > 1000 lines |
| **API error responses** | Partially centralized | Migrate remaining ~55 routes to `apiError()` helpers |
| **Supabase queries** | Inline in routes | Consider `lib/db/` query functions for repeated patterns |
| **Component patterns** | `ui/` primitives reused well | Extract repeated dashboard card patterns into `ui/` |
| **Ireland validation** | Scattered | Consolidate to `lib/ireland/` |

### 7.4 Bundle/Performance-Aware Organization

| Technique | Current | Recommendation | Priority |
|-----------|---------|----------------|----------|
| `next/dynamic` | 2 uses (Leaflet maps only) | Add for: dashboard charts, admin panels, rich text editors | P2 |
| `next/image` | **0 uses** | Replace all `<img>` tags — automatic WebP/AVIF, lazy loading, CLS prevention | **P1** |
| Bundle analyzer | None | Add `@next/bundle-analyzer` to `next.config.ts` | P2 |
| Tree shaking | Relies on Next.js defaults | Add barrel exports to `components/ui/` for better tree shaking | P2 |
| Route-based splitting | Automatic via App Router | ✅ Already handled by Next.js |

---

## 8) Implementation Roadmap

### Phase 0: No-Risk Documentation & Standards (1–2 days)

**Zero code changes. Zero breakage risk.**

| # | Action | Files | Effort |
|---|--------|-------|--------|
| 0.1 | Add `LICENSE` to repo root (proprietary or chosen license) | 1 new file | S |
| 0.2 | Add `SECURITY.md` to repo root (vulnerability disclosure policy) | 1 new file | S |
| 0.3 | Add `CODE_OF_CONDUCT.md` to repo root | 1 new file | S |
| 0.4 | Move/symlink `marketplace/README.md` to repo root | 1 file | S |
| 0.5 | Add `*.pem`, `*.key`, `*.p12`, `.vercel/`, `.turbo/` to `.gitignore` | 1 edit | S |
| 0.6 | Add JSDoc to each `lib/supabase/*.ts` explaining when to use | 4 edits | S |
| 0.7 | Document API error response contract in `docs/API_ERRORS.md` | 1 new file | S |

**Rollback:** `git revert` any commit — docs-only changes.

### Phase 1: Structural Cleanups (3–5 days)

**Low-risk file moves + barrel exports. No logic changes.**

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1.1 | Create `lib/ireland/` — move `eircode.ts`, `ireland-coordinates.ts`, `ireland-locations.ts`, `validation/phone.ts` | ~15 import updates | M |
| 1.2 | Create `lib/data/` — move `marketplace-data.ts`, `service-taxonomy.ts`, `provider-documents.ts`, `constants/job.ts` | ~20 import updates | M |
| 1.3 | Move `lib/stripe.ts` → `lib/stripe/client.ts` | ~12 import updates | S |
| 1.4 | Move `lib/animations.ts` → `lib/animations/index.ts` | ~8 import updates | S |
| 1.5 | Move misplaced dashboard components to feature dirs (QuoteActions → offers/, LeaveReviewForm → reviews/, JobMessagePanel → jobs/) | ~6 import updates | S |
| 1.6 | Add barrel exports to `components/ui/index.ts` | 1 new file, 0 breaking changes (existing paths still work) | S |
| 1.7 | Delete duplicate `app/[locale]/privacy-policy/` (redirect to `/privacy`) | 2 files removed, 1 redirect added | S |
| 1.8 | Move `checkout/` routes under `[locale]` | 2 dirs moved, update Stripe success/cancel URLs | S |
| 1.9 | Install Husky + lint-staged for pre-commit hooks | New dev deps, `.husky/` dir | S |

**Import update strategy:** Use VS Code's "Find and Replace" or `sed` for path updates. Each move is a single commit with `git mv` + import fixup. Run `npm run lint` after each to verify.

**Rollback:** Each move is its own commit — `git revert {commit}` for any individual change.

### Phase 2: Deeper Domain Refactors (5–7 days)

**Logic improvements. Test after each step.**

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 2.1 | Create `lib/config/env.ts` — centralize all `process.env` access | 8 files updated to import from `env` | M |
| 2.2 | Split `lib/validation/api.ts` (748 lines) into domain files (`auth.ts`, `jobs.ts`, `admin.ts`, etc.) with `index.ts` re-export | ~60 import updates (mitigated by re-export) | M |
| 2.3 | Standardize all API error responses to use `apiError()` / `apiUnauthorized()` helpers | ~55 route files | M |
| 2.4 | Standardize validation error format (choose `.flatten()` everywhere) | ~15 route files | S |
| 2.5 | Replace all `<img>` with `next/image` | ~8 component files | M |
| 2.6 | Add rate limiting to unprotected GET admin routes | ~6 route files | S |
| 2.7 | Extract Stripe webhook handlers into `lib/stripe/handlers/` | 1 large file → 6 smaller files | M |
| 2.8 | Populate `lib/hooks/` — extract reusable hooks from components | ~4 new hook files | M |
| 2.9 | Create `lib/types/domain.ts` — extract shared interfaces from inline definitions | New file + gradual adoption | M |
| 2.10 | Add `admin/layout.tsx` with role check | 1 new file | S |

**Dependency risks:**
- 2.2 (validation split) — re-exports in `index.ts` prevent breaking changes, but test all API routes after
- 2.3 (error standardization) — purely mechanical, but touch many files; do in batches of 10
- 2.5 (next/image) — may need `width`/`height` or `fill` prop; test visual output

**Rollback:** Each is a separate PR. Revert the PR if issues arise.

### Phase 3: CI/CD Hardening (2–3 days)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 3.1 | Add coverage threshold to `vitest.config.ts` (`lines: 70, functions: 70, branches: 65`) | CI fails if coverage drops | S |
| 3.2 | Add `@next/bundle-analyzer` + size limit check in CI | New dev dep, CI step | S |
| 3.3 | Add `npm audit --audit-level=high` to CI pipeline | 1 workflow edit | S |
| 3.4 | Add Vercel preview deploy URL comment on PRs | 1 new workflow or Vercel integration | S |
| 3.5 | Enable TypeScript strict mode incrementally (`noImplicitAny: true` first) | Fix ~20–50 implicit any errors | L |
| 3.6 | Add PR size check (warn if > 500 lines changed) | 1 new workflow | S |
| 3.7 | Add API route count regression test (ensure no routes lose auth/validation) | 1 new test file | M |

**Rollback:** Each is a CI config change — revert the workflow file.

---

## Summary Tables

### Current vs Target Mapping

| Area | Current Path | Target Path | Change Type |
|------|-------------|-------------|-------------|
| Eircode validation | `lib/eircode.ts` | `lib/ireland/eircode.ts` | Move |
| Ireland coordinates | `lib/ireland-coordinates.ts` | `lib/ireland/coordinates.ts` | Move |
| Ireland locations | `lib/ireland-locations.ts` | `lib/ireland/locations.ts` | Move |
| Phone validation | `lib/validation/phone.ts` | `lib/ireland/phone.ts` | Move |
| Stripe client | `lib/stripe.ts` | `lib/stripe/client.ts` | Move |
| Animations | `lib/animations.ts` | `lib/animations/index.ts` | Move |
| Categories data | `lib/marketplace-data.ts` | `lib/data/categories.ts` | Move + rename |
| Service taxonomy | `lib/service-taxonomy.ts` | `lib/data/services.ts` | Move + rename |
| Provider docs | `lib/provider-documents.ts` | `lib/data/documents.ts` | Move + rename |
| Job budgets | `lib/constants/job.ts` | `lib/data/budgets.ts` | Move |
| QuoteActions | `components/dashboard/QuoteActions.tsx` | `components/offers/QuoteActions.tsx` | Move |
| LeaveReviewForm | `components/dashboard/LeaveReviewForm.tsx` | `components/reviews/LeaveReviewForm.tsx` | Move |
| JobMessagePanel | `components/dashboard/JobMessagePanel.tsx` | `components/jobs/JobMessagePanel.tsx` | Move |
| JobPhotoUploader | `components/dashboard/JobPhotoUploader.tsx` | `components/jobs/JobPhotoUploader.tsx` | Move |
| Validation monolith | `lib/validation/api.ts` (748 lines) | `lib/validation/{auth,jobs,admin,disputes,profile,payments,common}.ts` + `index.ts` | Split |
| Stripe webhook handlers | `app/api/webhooks/stripe/route.ts` (543 lines) | `lib/stripe/handlers/{payment,subscription,invoice,identity,dispute,account}.ts` | Extract |
| Env var access | Scattered `process.env` in 8 files | `lib/config/env.ts` centralized | Centralize |
| Auth pages | `app/[locale]/login/`, etc. (flat) | `app/(auth)/login/`, etc. (route group) | Optional |
| Static pages | `app/[locale]/about/`, etc. (flat) | `app/[locale]/(marketing)/about/`, etc. | Optional |
| Privacy duplicate | `privacy/` + `privacy-policy/` | `privacy/` only (redirect from old URL) | Delete + redirect |
| Checkout | `app/checkout/` | `app/[locale]/checkout/` | Move |

### Priority Action List

| ID | Action | Phase | Effort | Priority | Risk |
|----|--------|-------|--------|----------|------|
| 0.1 | Add LICENSE | 0 | S | P0 | None |
| 0.2 | Add SECURITY.md | 0 | S | P0 | None |
| 0.5 | Update .gitignore | 0 | S | P0 | None |
| 1.9 | Add Husky + lint-staged | 1 | S | P0 | None |
| 2.5 | Replace `<img>` with `next/image` | 2 | M | P1 | Visual testing needed |
| 2.3 | Standardize API error responses | 2 | M | P1 | Test all routes |
| 2.6 | Rate-limit GET admin routes | 2 | S | P1 | None |
| 1.8 | Move checkout under [locale] | 1 | S | P1 | Update Stripe URLs |
| 2.10 | Add admin layout role check | 2 | S | P1 | None |
| 1.1 | Create lib/ireland/ | 1 | M | P1 | Import updates |
| 1.2 | Create lib/data/ | 1 | M | P1 | Import updates |
| 2.1 | Centralize env vars | 2 | M | P1 | Test all services |
| 2.2 | Split validation monolith | 2 | M | P2 | Re-export mitigates risk |
| 2.7 | Extract Stripe webhook handlers | 2 | M | P2 | Test webhook flow |
| 1.3 | Move stripe.ts to stripe/client.ts | 1 | S | P2 | Import updates |
| 1.5 | Move misplaced dashboard components | 1 | S | P2 | Import updates |
| 1.6 | Add barrel exports to ui/ | 1 | S | P2 | Non-breaking |
| 3.1 | Add coverage thresholds | 3 | S | P2 | May fail initially |
| 3.2 | Add bundle analyzer | 3 | S | P2 | None |
| 3.5 | Enable TS strict mode | 3 | L | P2 | ~50 fixes needed |
| 2.8 | Populate lib/hooks/ | 2 | M | P2 | Gradual |
| 2.9 | Create lib/types/domain.ts | 2 | M | P2 | Gradual |
| 1.7 | Delete privacy-policy duplicate | 1 | S | P2 | Add redirect |
| 3.3 | Add npm audit to CI | 3 | S | P2 | None |
| 3.4 | Vercel preview deploy on PRs | 3 | S | P3 | None |
| 3.6 | PR size check | 3 | S | P3 | None |
| 3.7 | API route regression test | 3 | M | P3 | None |

---

## Appendix: File Statistics

| Category | Count |
|----------|-------|
| Total TS/TSX files | 252 |
| Page components | 54 |
| API route handlers | 105 |
| React components | 153 |
| Library modules | 45 |
| Supabase migrations | 74 |
| CI/CD workflows | 6 |
| Test files | 22 |
| npm scripts | 16 |
| Edge functions | 6 |
| Email templates | 11 |
| Zod schemas | 60+ |
| Documentation files | 16 |
| Utility scripts | 9 |

---

*Report generated from evidence-based codebase analysis. All paths reference the actual repository at `c:\Users\Ada\Git\Python\WorkMate\`.*
