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

> Full frozen decisions, design rules, and code patterns: `ai-context/context/agents.md` (sections 2–4).
> This section is a short reminder for human contributors — not the authoritative source. If there is a conflict, agents.md wins.

- Strict mode is **off** (`strict: false` in `tsconfig.json`). Avoid `any` types where possible.
- Zod schemas in `lib/validation/api.ts` only. `z.record()` requires two args: `z.record(z.string(), z.string())`.
- Colors via `--wm-*` CSS tokens only — no hardcoded hex, no Tailwind color names in page/feature code.
- `<Button>`, `<PageHeader>`, `<EmptyState>` always — no raw HTML equivalents.
- Money as integer cents (`*_amount_cents`) in EUR — never floats. Supabase client: use the right one per context.
- All pages under `app/[locale]/`. Every data-fetching page needs co-located `loading.tsx`.
- Eircode + Irish phone normalisation enforced on all address/job forms.

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
- The next migration file to create is **`080_*.sql`**. Migrations 001–079 are all applied.
- Rules:
  - **Additive only.** Never rewrite or renumber an existing migration.
  - **Descriptive names.** Format: `074_short_description.sql`.
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
   - Lighthouse CI check passes (runs nightly; no blocking regressions)
   - No secrets, API keys, or credentials are present anywhere in the diff
   - All new pages have a co-located `loading.tsx`
   - All new list views have an `EmptyState` handler

4. PRs require at least one review before merge.

5. CI quality checks:
   - `.github/workflows/lighthouse.yml` (nightly performance gate)

6. Squash-merge to keep the main branch history clean.

---

## Security

> Full security guardrails: `ai-context/context/agents.md` sections 2–3.

Key reminders:
- RLS on every table — never `FOR ALL USING (true)`.
- No PII in logs. No secrets in code — use `.env.local` (gitignored).
- Run `npm run check:prepublic-security` and `npm run check:pr-guardrails` before pushing sensitive changes.
- Webhooks: HMAC-SHA256 signed via `lib/webhook/send.ts`, HTTPS only.
- Stripe: secure hold-then-capture. Never capture without verifying job completion.

---

> Ireland-specific rules (Eircode, phone, currency, language, GDPR) are in `ai-context/context/agents.md` sections 2.1–2.2.
