---
VERSION: 1.0
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Initial stack and tooling map added
- Included test and quality gates
---

# Tech Stack

## Application Stack

- Frontend: Next.js 16.1.6 (App Router), React 19, TypeScript.
- Internationalization: `next-intl` with locale infrastructure (currently `en` only).
- Styling: Tailwind CSS, CSS Modules, Framer Motion.
- Validation: Zod plus custom Ireland-oriented validators.

## Backend and Data

- Server runtime: Next.js route handlers and server components.
- Database/Auth/Storage: Supabase (PostgreSQL + RLS + Auth + Storage).
- Payments: Stripe Connect (`manual` capture flow for secure hold model).
- Background jobs: Supabase Edge Functions and SQL cron-based tasks.

## Tooling

- Package manager: npm (`package-lock.json` present).
- Unit/Integration tests: Vitest.
- E2E tests: Playwright.
- Type/lint gate: `npm run lint` (TypeScript noEmit + English checks).

## Key Scripts

- `npm run dev`, `npm run build`, `npm run start`
- `npm run lint`, `npm run test`
- `npm run test:unit`, `npm run test:integration`, `npm run test:e2e:smoke`
- `npm run check:english`, `npm run check:pr-guardrails`
- `npm run check:prepublic-security`, `npm run preflight`

