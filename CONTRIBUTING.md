# Contributing to WorkMate

WorkMate is an Ireland-first services marketplace built on Next.js, Supabase, and Stripe Connect. This guide covers everything you need to contribute effectively.

---

## Getting Started

### Prerequisites

- Node.js 20 or later
- Git
- A Supabase account (for local development against the hosted DB)
- A Stripe account (for payment flow testing)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/workmate.git
cd workmate

# 2. Install dependencies (all work happens inside marketplace/)
cd marketplace
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in all required values — see .env.example for descriptions
```

### Required Environment Variables

At minimum you need:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-only) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `RESEND_API_KEY` | Resend email service key |
| `ANTHROPIC_API_KEY` | AI job description writer |
| `NEXT_PUBLIC_PLATFORM_BASE_URL` | e.g. `http://localhost:3000` |

---

## Development

### Starting the dev server

```bash
# From marketplace/
npm run dev               # Start on http://localhost:3000 (Turbopack)
npm run dev:checked       # English check + preflight sanity check + dev server
```

### Other useful commands

```bash
npm run build             # English check + production build
npm run preflight         # Pre-dev environment sanity check (standalone)
npm run check:english     # Verify no non-English UI strings have leaked in
npm run health-check      # Runtime health check script
```

---

## Code Standards

### TypeScript

- Strict mode is enabled — no `any` types.
- All Zod schemas go in `lib/validation/api.ts`. No inline schemas in route files.
- Zod 4 syntax: `z.record()` requires two type arguments:

  ```ts
  // Correct
  z.record(z.string(), z.string())

  // Wrong — will throw at runtime
  z.record(z.string())
  ```

### Design System

- **Colors via CSS tokens only.** Use `--wm-*` variables. Never write hardcoded hex values (`#00B894`) or Tailwind color utilities (`text-zinc-500`, `bg-emerald-600`) in page or feature code.

  ```tsx
  // Correct
  <p style={{ color: 'var(--wm-muted)' }}>...</p>

  // Wrong
  <p className="text-zinc-500">...</p>
  ```

- **`Button` component always.** Never use a raw `<button className="bg-...">` or `<Link className="bg-...">`.
- **`PageHeader` component always.** Never use a raw `<Card>` + `<h1>` combination at the top of a page.
- **`EmptyState` component always.** Every list view must handle the zero-item state explicitly.
- **Responsive grids.** Card lists default to `sm:grid-cols-2 lg:grid-cols-3`.

### Routing

- All pages live under `app/[locale]/`. Never create pages outside this directory.
- Every page that fetches data **must** have a co-located `loading.tsx` file.

### Supabase Clients

Use the correct client for each context. Never create a module-scope singleton.

| Context | Import |
|---|---|
| Client component (`'use client'`) | `getSupabaseBrowserClient()` from `lib/supabase/client.ts` |
| Server component / page | `getSupabaseServerClient()` from `lib/supabase/server.ts` |
| API route handler | `getSupabaseRouteClient()` from `lib/supabase/route.ts` |
| Admin / service-role bypass | `getSupabaseServiceClient()` from `lib/supabase/service.ts` |

### Money

- All monetary values are stored as integers in **cents** (`*_amount_cents`).
- Currency is **EUR only**. No multi-currency support.
- Never store decimal euro values.

### Ireland-Specific

- **Eircode**: validation is enforced on all job-posting and address forms.
- **Phone**: normalize to `+353XXXXXXXXX` (valid mobile prefixes: 83, 85, 86, 87, 89).
- **UI language**: English only. No translated strings, no additional locales.

---

## Testing

All test commands run from `marketplace/`:

```bash
# Unit tests (Vitest)
npm run test:unit

# Integration tests (Vitest)
npm run test:integration

# Watch mode (re-runs on file change)
npm run test:watch

# Coverage report
npm run test:coverage

# E2E smoke tests — Chromium only, fast
npm run test:e2e:smoke

# Full E2E suite (Playwright)
npm run test:e2e

# Type-check + English string check
npm run lint

# ESLint
npm run lint:eslint
```

To run a single test file:

```bash
npx vitest run --config vitest.config.ts tests/unit/my-file.test.ts
```

---

## Database Migrations

- Migration files live in `marketplace/migrations/`.
- Migrations are applied **manually** via the Supabase SQL Editor — there is no CLI push workflow.
- The next migration file to create is **`059_*.sql`**. Migrations 001–058 are all applied.
- Rules:
  - **Additive only.** Never rewrite or renumber an existing migration.
  - **Descriptive names.** Format: `059_short_description.sql`.
  - **RLS required.** Every new table must have Row Level Security enabled with appropriate policies. Never use `FOR ALL USING (true)`.
  - **No destructive DDL** in migrations that are intended for production (no `DROP TABLE`, no column removal without a deprecation plan).

Note: there is a known file naming collision at `021` (`021_pro_documents_rls.sql` and `021_user_roles_multi_role.sql`). Both are applied. This cannot be fixed retroactively.

---

## Pull Request Process

1. Branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. PR title format:
   ```
   feat: add provider portfolio gallery
   fix: correct Eircode validation regex
   chore: bump stripe to v20
   docs: update contributing guide
   ```

3. Before opening a PR, ensure:
   - `npm run lint` passes (type-check + English string check)
   - `npm run lint:eslint` passes with no new warnings
   - `npm run test:unit` and `npm run test:integration` pass
   - `npm run test:e2e:smoke` passes
   - No secrets, API keys, or credentials are present anywhere in the diff
   - All new pages have a co-located `loading.tsx`
   - All new list views have an `EmptyState` handler

4. PRs require at least one review before merge.

5. Squash-merge to keep the main branch history clean.

---

## Security

- **RLS on every table.** Row Level Security must be enabled on all new tables. Never use an open policy (`FOR ALL USING (true)`).
- **Zod validation on every API route.** All request bodies and query params must be validated with a Zod schema defined in `lib/validation/api.ts`.
- **No PII in logs.** Never log email addresses, phone numbers, full names, or financial data.
- **Webhooks are HMAC-SHA256 signed.** All outbound webhooks go through `lib/webhook/send.ts` and include an `X-WorkMate-Signature` header. HTTPS only.
- **No secrets in code.** All secrets go in `.env.local` (gitignored). Run `npm run check:prepublic-security` and `npm run check:pr-guardrails` before pushing sensitive changes.
- **Stripe payments.** Use the secure hold-then-capture flow. Never capture payments server-side without verifying job completion status first.

---

## Ireland-Specific Rules (Summary)

| Rule | Detail |
|---|---|
| Currency | EUR only, stored in cents (`*_amount_cents`) |
| Eircode | Validated on all address/job forms |
| Phone | Must normalize to `+353XXXXXXXXX` |
| Language | English only — no other locales |
| Legal | Privacy Policy at `/privacy`, Terms at `/terms` |
| Garda vetting | Required for childcare, eldercare, home-access services |
