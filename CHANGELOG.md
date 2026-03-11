# Changelog

All notable changes to WorkMate are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- **Error boundary coverage** — `ErrorBoundaryPage` reusable component (`components/ui/ErrorBoundaryPage.tsx`); 49 new `error.tsx` wrappers across all `app/[locale]/` pages — 100% coverage (56 total)
- **Page transitions** — `components/layout/PageTransition.tsx` wraps all routed pages with Framer Motion `AnimatePresence`; 0.32 s enter / 0.18 s exit
- **`JobStatusBadge`** — animated Framer Motion badge for all 9 job statuses with pulse dot for active states and shake animation for disputed
- **Migration 078** — `marketplace/migrations/078_provider_search_indexes.sql`: 10 `CREATE INDEX CONCURRENTLY` indexes for profiles, jobs, quotes, reviews, notifications, funnel events, credit transactions, and webhook events
- **Migration 079** — `marketplace/migrations/079_username_system.sql`: username system added to profiles
- **Locale-wrapped checkout** — `app/[locale]/checkout/success` and `cancel` pages created; old non-locale pages redirect to new routes; Stripe checkout URLs updated
- **Locale routing + auth guard restored** — `proxy.ts` is the sole Next.js 16 middleware entry point (FD-28: `middleware.ts` must never exist); re-wired after Feb 2026 gap
- **`CHANGELOG.md`** — full project history v0.0.1→current created
- TypeScript type-check CI workflow — runs `tsc --noEmit` on every PR and `main` push
- Dependency review CI workflow — blocks high-severity CVEs and non-approved licenses on PRs
- `CODEOWNERS` — required reviews for payment paths, auth, migrations, and CI/CD config
- `next/image` migration — all `<img>` tags replaced with `next/image` across 9 components/pages
- Cloudflare R2 remote patterns in `next.config.ts` for portfolio/avatar image delivery

### Fixed
- Navbar "Find Services" and "How It Works" wrapping to two lines — `whitespace-nowrap` on all nav links, `gap-5` spacing, `text-[14px]`; authenticated state collapsed Saved Searches and Messages to icon-only buttons
- Error response migration — 96/111 API routes now use `lib/api/error-response.ts` helpers (was 16 in session 24)

---

## [0.6.0] — 2026-03-11 (P5)

### Added
- **Blog** — `/blog/[slug]` individual article pages with full content for 4 posts
- **Referral page** — `/dashboard/referrals`: own code display, copy/share link, redemption history
- **Credits page** — `/dashboard/pro/credits`: balance overview, transaction history, how-to guide
- **Notification preferences** — account settings panel; `GET/POST /api/user/notification-prefs` stored in user metadata
- **Cloudflare Turnstile** — bot protection on signup and guest job intent forms
- **Cloudflare AI Gateway** — Anthropic API routed via gateway for caching, logging, rate limiting
- **Cloudflare Web Analytics** — privacy-first, cookie-free analytics beacon in root layout
- **Cloudflare R2** — presigned upload API at `POST /api/uploads/presign` (avatar 5 MB, document 20 MB, portfolio 10 MB)
- `GET /api/referral/my-code` — auto-creates a referral code for the authenticated user

### Changed
- CSP headers updated to allow Cloudflare domains (Turnstile, Insights, R2, AI Gateway)
- Both AI routes now use `getAnthropicClient()` singleton (routes via CF gateway if URL set)

---

## [0.5.0] — 2026-03-11 (P4)

### Added
- **Referral redemption** — `POST /api/referral/redeem`: validates code, creates redemption record, grants 10 credits to referrer
- **Sign-up referral code field** — collapsible "Have a referral code?" input; stored in user metadata for post-login redemption
- Migrations 076 (`provider_credits`) and 077 (`loyalty_levels`) on disk

### Fixed
- Phone validation error message updated to include UK +44 mobiles
- Eircode validation relaxed to pass-through (strict regex deferred to real Eircode API)

---

## [0.4.0] — 2026-03-10 (P3)

### Added
- **Provider credit system** — migration 076: `provider_credits` + `credit_transactions` tables with RLS
- Credit library — `lib/credits/provider-credits.ts`: balance queries, adjust, debit on quote, monthly grant
- `GET /api/provider/credits` — balance and last 50 transactions
- Monthly credit grant cron — `GET /api/admin/grant-monthly-credits` (1st of month)
- Credit debit on quote — 1 credit per quote (2 if urgent), non-blocking
- **Subscription gates** — `lib/subscriptions/gates.ts`: `hasFeature()`, `planHasFeature()`, feature-to-plan map
- **Loyalty levels** — migration 077: `loyalty_level` column on profiles; `lib/loyalty/levels.ts`
- Loyalty level cron — `GET /api/admin/update-loyalty-levels` (nightly 02:00 UTC)
- Provider badges — `PROVIDER_DOCUMENT_BADGES` in `documents.ts`; `ProviderBadges` server component on public profiles

---

## [0.3.0] — 2026-03-09 (P2)

### Added
- Unverified customer UX — "Limited Visibility" banner on job detail; `max_quotes=5` for unverified customer listings
- Admin SLA enrichment — pending-jobs route returns `hours_pending` and `is_overdue` per job
- SLA cron — `GET /api/admin/sla-check` notifies admins when jobs are >24 hours unreviewed
- Vercel Cron configuration in `vercel.json` (hourly, secured via `CRON_SECRET`)

### Changed
- Job visibility gate removed — all verified providers can quote any listing regardless of plan

### Fixed
- Eircode pass-through — `isValidEircode()` always returns true for non-empty values
- UK phone support — `isValidIrishPhone()` and `normalizeIrishPhone()` now accept `+44 7xxx` UK mobiles

---

## [0.2.0] — 2026-03-08 (P1)

### Added
- **Hybrid pricing** — tiered platform fee: €0–49 → 0%, €50–99 → 5%, €100–299 → 7%, €300+ → 5%
- **Cancel API** — `POST /api/jobs/[jobId]/cancel` with time-based penalty: <1 h → 0%, ≥1 h → 10%, in-progress → 30%
- **Dispute types** — migration 075: `pricing_dispute`, `offline_payment`, `no_show_provider`, `no_show_customer`
- `AcceptOfferModal` — payment double-confirmation with checkbox gate before proceeding
- Job approved email — template + `sendJobApprovedEmail()` wired into admin approve route

### Changed
- Provider commission rates: Basic 5% (was 3%), Pro 3% (was 1.5%), Premium 1.5% (unchanged)

---

## [0.1.0] — 2026-03-07 (P0)

### Added
- Budget option €0–€50 as first tier in `JOB_BUDGET_OPTIONS`
- Guest email uniqueness — same email limited to 1 active job intent; returns 409 with `/register` redirect

### Removed
- Garda Vetting system — 8 files deleted, 23 files updated; migration 074 applied (`DROP COLUMN`)

---

## [0.0.10] — 2026-03-06

### Fixed
- Guest job intent status set to `'email_pending'` (was incorrect `'pending_verification'` — not in DB CHECK constraint)
- Status drift CI guardrail — `scripts/check-status-drift.mjs` detects DB constraint vs code literal mismatches
- 16 content compliance violations: fabricated stats, fake testimonials, competitor names, fee mismatches

---

## [0.0.9] — 2026-03-05

### Added
- Standardized API error response helpers — `apiError`, `apiUnauthorized`, `apiForbidden`, `apiNotFound`, `apiConflict`, `apiServerError`, `apiValidationError` in `lib/api/error-response.ts`
- Rate limiting middleware on all write endpoints
- Admin audit logging
- Dashboard nested layout with error boundaries

---

## [0.0.8] — 2026-03-04

### Added
- Sentry error tracking integration
- GA4 consent-aware loader — no tracking before cookie acceptance
- Service status dashboard at `/dashboard/admin/status`
- 5-service health check endpoint at `/api/health` with `?detailed=true` admin mode

---

## [0.0.7] — 2026-03-03

### Added
- Full design system with `--wm-*` tokens (`--wm-grad-*`, `--wm-glass`, `--wm-glow-primary`, `--wm-shadow-*`)
- Syne + Plus Jakarta Sans typography
- Utility classes: `.wm-surface`, `.wm-glass`, `.wm-grain`, `.wm-section-label`, `.wm-display`
- Zero hardcoded hex colours across all components

---

## [0.0.6] — 2026-03-02

### Added
- SEO — JSON-LD structured data, Open Graph tags, `next-sitemap`, CSP headers
- GDPR — `docs/ROPA.md` (12 activities, 7 DPAs), cookie consent, GDPR export/delete API
- Rate limiting — `lib/rate-limit/` with pluggable `RateLimitStore` adapter interface
- Notification bell — in-app notifications with 30 s polling
- Job status timeline, profile completeness widget, advanced search (31 counties)

---

## [0.0.5] — 2026-03-01

### Added
- Stripe Connect — secure hold, capture, refund, dispute handling
- Job contracts — `job_contracts` table, milestone tracking
- Stripe subscription webhooks — `customer.subscription.*`, idempotency via `webhook_events` table
- Funnel telemetry — provider signup, job post, and quote funnels
- Email notifications — 6 transactional templates via Resend

---

## [0.0.4] — 2026-02-28

### Added
- Provider onboarding — multi-step form with auto-save
- Document upload — Supabase Storage with admin review queue
- Subscription plans — Basic / Professional / Premium with Stripe Checkout
- Founding Pro config — `founding_pro_config` table, banner component

---

## [0.0.3] — 2026-02-25

### Added
- Guest job post flow — 3-step wizard with email verification
- Quote system — provider submits quotes, customer accepts
- Offer & payment flow — AcceptOfferModal → Stripe payment intent
- Reviews — post-job review with rating and text

---

## [0.0.2] — 2026-02-20

### Added
- Auth — Supabase Auth with Google, Facebook, Apple OAuth
- Provider profile — public profile, portfolio, availability
- Job listings — create, search (31 counties, 20 categories), detail page
- Admin panel — provider application review, job moderation

---

## [0.0.1] — 2026-02-15

### Added
- Initial Next.js 16 App Router setup with Turbopack
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- next-intl i18n scaffold (English only)
- Tailwind CSS with custom design tokens
- Zod 4 validation, Framer Motion, @dnd-kit
