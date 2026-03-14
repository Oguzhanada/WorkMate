# WorkMate — marketplace/

Next.js 16 application root (App Router, Turbopack). All commands run from this directory.

> **Scope note:** This file is not a source of truth for AI rules or frozen decisions.
> Canonical AI sources: `ai-context/context/agents.md` · `ai-context/context/PROJECT_CONTEXT.md`

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in required values — see docs/SECRETS_MAP.md
npm run dev                  # http://localhost:3000
```

## Commands

```bash
npm run dev               # Dev server (Turbopack)
npm run dev:checked       # English check + preflight + dev server
npm run build             # Production build
npm run lint              # Type-check + English string check
npm run test:unit         # Vitest unit tests
npm run test:integration  # Vitest integration tests
npm run test:e2e:smoke    # Playwright smoke (Chromium only)
npm run test:e2e          # Full Playwright suite
npm run preflight         # Pre-dev environment sanity check
npm run check:english     # Verify no non-English UI strings leaked in
```

## Environment Variables

Full reference: `docs/SECRETS_MAP.md`. Use `.env.example` as the template.
Keep real values in `.env.local` (gitignored). Never commit secrets.

## Notes

- Eircode validated with Irish-specific regex, normalised to uppercase.
- Verified Pros enforced at DB trigger level before quote creation.
- Stripe: `capture_method=manual` — secure hold → capture on job completion.
- Commission: `PLATFORM_COMMISSION_RATE` env var (default `0` for test mode).
- `ADDRESS_PROVIDER=none` validates Eircode format only (no paid geocoding needed in dev).

## Test Automation

```bash
npm run test:unit
npm run test:integration
npm run test:e2e:smoke
npm run test:e2e
```

E2E credentials (optional — tests skip if missing):
```bash
E2E_CUSTOMER_EMAIL=customer@example.com
E2E_CUSTOMER_PASSWORD=REPLACE_ME
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=REPLACE_ME
```

Test folders: `tests/e2e/`, `tests/integration/`, `tests/unit/`, `tests/setup/`

CI: `.github/workflows/workmate-english-only.yml` · `workmate-ci-tests.yml` · `workmate-nightly-e2e.yml`

## MCP Pilot (Read-Only)

Decision: `ai-context/decisions/DR-006-mcp-readonly-pilot.md`
Runbook: `docs/mcp-pilot/` · `docs/agent-ops-runbook.md`

## Documentation

Active docs: `docs/` · Archived: `docs/archive/`

Security note: CSP is route-tiered and nonce-aware. See `docs/csp-architecture.md` before changing security headers or adding inline scripts.
