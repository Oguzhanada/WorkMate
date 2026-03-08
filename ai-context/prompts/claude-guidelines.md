# Claude Guidelines

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

```
WorkMate/
├── marketplace/          # Next.js app (all work happens here)
│   ├── app/
│   │   ├── [locale]/    # All routed pages — locale-aware (en only)
│   │   ├── api/         # API route handlers
│   │   ├── actions/     # Server actions (offers.ts, task-alerts.ts)
│   │   └── auth/callback/route.ts   # OAuth callback
│   ├── components/
│   │   ├── ui/          # Shared primitives (Button, Card, Badge, StatCard, PageHeader, EmptyState, Skeleton, ProgressBar, InfoTooltip)
│   │   ├── dashboard/   # DashboardShell, WidgetGrid, widget-types.ts, widgets/
│   │   ├── auth/ forms/ home/ payments/ profile/ jobs/ offers/ site/
│   ├── lib/
│   │   ├── supabase/    # client.ts | server.ts | route.ts | service.ts
│   │   ├── auth/rbac.ts # Role helpers — getUserRoles, canAccessAdmin, canQuote…
│   │   ├── email/       # client.ts | send.ts | templates.ts (Resend)
│   │   ├── api/public-auth.ts       # API key validation + rate limiting
│   │   ├── webhook/send.ts          # HMAC-SHA256 signed webhook delivery
│   │   ├── automation/engine.ts     # Automation rules engine
│   │   ├── dashboard/widgets.ts     # DashboardMode, WidgetType, defaults
│   │   ├── jobs/access.ts           # Job participant access resolver
│   │   └── validation/ ranking/ pricing/ types/ hooks/ i18n/ constants/
│   ├── migrations/      # 001–058 ALL APPLIED in Supabase. Next = 059.
│   └── messages/en.json # i18n strings (English only)
├── scripts/             # Standalone .mjs scripts (seed-ireland.mjs…)
└── docs/                # Checkpoints, production launch guide
```

## Commands

All commands run from `marketplace/`:

```bash
# Development
npm run dev                   # Start dev server (Turbopack)
npm run dev:checked           # English check + preflight + dev server

# Build & type-check
npm run build                 # English check + next build
npm run lint                  # English check + tsc --noEmit

# Tests
npm run test:unit             # vitest unit tests (tests/unit/)
npm run test:integration      # vitest integration tests (tests/integration/)
npm run test:watch            # vitest watch mode
npm run test:e2e:smoke        # Playwright smoke (Chromium only)
npm run test:e2e              # Full Playwright suite

# Checks
npm run check:english         # Ensure no non-English UI strings leaked in
npm run preflight             # Pre-dev environment sanity check

# Seeding
node scripts/seed-ireland.mjs # Seed realistic Irish data (demo password: WorkMate2026!)
```

To run a single vitest test file:
```bash
npx vitest run --config vitest.config.ts tests/unit/my-file.test.ts
```

## Supabase Clients — Use the Right One

| Context | Import |
|---|---|
| Client component (`'use client'`) | `getSupabaseBrowserClient()` from `lib/supabase/client.ts` |
| Server component / page | `getSupabaseServerClient()` from `lib/supabase/server.ts` |
| API route handler | `getSupabaseRouteClient()` from `lib/supabase/route.ts` |
| Admin / service-role bypass | `getSupabaseServiceClient()` from `lib/supabase/service.ts` |

`lib/supabase.ts` has been deleted. Never re-create a module-scope singleton.

## RBAC

Roles: `customer`, `verified_pro`, `admin` (stored in `user_roles` table, with fallback to `profiles.role`).

```ts
import { getUserRoles, canAccessAdmin, canQuote } from '@/lib/auth/rbac';
```

Admin and pro can both post jobs; only `verified_pro`/`admin` can quote.

## Routing

All pages live under `app/[locale]/`. The locale segment is always `en` in practice — next-intl infrastructure is in place but only English content exists. Never create pages outside `[locale]/` (orphan routes have been cleaned up).

Every page that fetches data **must** have a co-located `loading.tsx`.

## Design System Rules

- **CSS variables only** — all colors via `--wm-*` tokens (`--wm-primary: #00B894`, `--wm-primary-dark: #008B74`). No hardcoded hex in page/feature code.
- **Button component always** — never `<button className="bg-...">` or `<Link className="bg-...">`.
- **PageHeader component** — never raw Card+h1 at the top of pages.
- **EmptyState component** — every list must handle the zero-item state.
- **Responsive grids** — card lists use `sm:grid-cols-2 lg:grid-cols-3` by default.

## Ireland-Specific Rules

- **Money**: always stored in cents (`*_amount_cents`), EUR only.
- **Phone**: normalize to `+353XXXXXXXXX` (valid prefixes: 83, 85, 86, 87, 89).
- **Eircode**: validation enforced on all job-posting and address forms.
- **UI language**: English only — no translated strings, no other locales.

## Migrations

- Migrations in `marketplace/migrations/` are applied manually via the Supabase SQL Editor.
- 001–058 are all applied. Next migration file = **059_\*.sql**.
- Never rewrite or renumber existing migrations — additive only.
- Note: two files are both numbered `021` (a known collision that cannot be fixed).

## Zod 4 Syntax

Zod 4 changed `z.record()` — always pass two type arguments:
```ts
// Correct
z.record(z.string(), z.string())
// Wrong — will error
z.record(z.string())
```

## Key Architecture Decisions

- **Dashboard widgets**: `DashboardShell` + `WidgetGrid` (@dnd-kit drag-drop). Widget config stored in `dashboard_widgets` table (migration 049). Modes: `customer`, `pro`, `admin`.
- **Public API**: `app/api/public/v1/` — authenticated via `x-api-key` header → `profiles.api_key`. Rate-limited in-memory.
- **Webhooks**: HMAC-SHA256 signed, HTTPS-only, delivered from `lib/webhook/send.ts`. Events: `job.created`, `quote.accepted`, `payment.completed`.
- **Email**: Resend via `lib/email/send.ts`. Sender: `notifications@workmate.ie`. Requires `RESEND_API_KEY` env var.
- **Payments**: Stripe Connect — secure hold → capture/refund flow.
- **Two verification layers**: `id_verification_status` (identity/Stripe Identity) + `verification_status` (provider/business docs).
