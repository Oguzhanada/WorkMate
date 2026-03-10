# WorkMate  (Next.js + Supabase + Stripe Connect)

## Project guardrails

- English-only across UI, docs, errors, and policies.
- Ireland-first for legal/compliance/product decisions.
- If a requested change conflicts with Ireland compliance, stop and apply a compliant alternative.
- See `AGENTS.md` for the full permanent rule set.

## Suggested Next.js folder structure

```text
marketplace/
├─ app/
│  ├─ (auth)/onboarding/pro/page.tsx
│  ├─ api/
│  │  ├─ address-lookup/route.ts
│  │  ├─ jobs/route.ts
│  │  ├─ quotes/route.ts
│  │  └─ connect/
│  │     ├─ create-account-link/route.ts
│  │     ├─ create-secure-hold/route.ts
│  │     └─ capture-payment/route.ts
│  ├─ checkout/
│  │  ├─ success/page.tsx
│  │  └─ cancel/page.tsx
│  ├─ dashboard/pro/page.tsx
│  └─ post-job/page.tsx
├─ components/
│  ├─ dashboard/ProDashboard.tsx
│  ├─ forms/EircodeAddressForm.tsx
│  ├─ forms/JobMultiStepForm.tsx
│  ├─ forms/ProOnboardingForm.tsx
│  └─ payments/SecureHoldButton.tsx
├─ lib/
│  ├─ eircode.ts
│  ├─ stripe.ts
│  └─ supabase.ts
├─ docs/ie_compliance_architecture.json
└─ migrations/001_initial_marketplace_schema.sql
```

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADDRESS_PROVIDER=ideal_postcodes # or loqate
IDEAL_POSTCODES_API_KEY=YOUR_IDEAL_POSTCODES_KEY
LOQATE_API_KEY=YOUR_LOQATE_KEY
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
NEXT_PUBLIC_PLATFORM_BASE_URL=http://localhost:3000
```

Use `.env.example` as the template and keep real values in `.env.local`.

Security note:
- Never commit `.env.local`, service keys, bearer tokens, or private webhook secrets.
- If any secret is ever shared in chat/screenshots, rotate it immediately.
- Run `npm run check:prepublic-security` before making the repository public.

Development recommendation:
- Use `ADDRESS_PROVIDER=none` to validate only Eircode format and collect county/city from dropdown lists.
- Enable paid geocoding providers later in production when needed.

## Notes
- Eircode is validated with Irish-specific regex and normalized to uppercase.
- Verified Pros are enforced at DB trigger level before quote creation.
- Stripe flow uses `capture_method=manual` for secure hold and captures on completion.
- Commission is configurable via `PLATFORM_COMMISSION_RATE` (default `0` for launch/test mode).

## Test automation baseline

### Local commands

```bash
npm run test:unit
npm run test:integration
npm run test:e2e:smoke
npm run test:e2e
```

### Manual UI smoke checks (required for shell/nav changes)

- Keep the homepage open for 30-60 seconds after load.
- Confirm no auth placeholder/skeleton flicker appears in the navbar during token refresh.
- Confirm navigation actions remain visible and stable throughout that interval.

### Required E2E environment variables

```bash
E2E_CUSTOMER_EMAIL=customer@example.com
E2E_CUSTOMER_PASSWORD=REPLACE_ME
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=REPLACE_ME
```

If these are missing, credential-based smoke tests are skipped automatically.

### Test folders

```text
tests/
├─ e2e/
│  └─ smoke/
├─ integration/
├─ setup/
└─ unit/
```

### CI workflows

- `.github/workflows/workmate-english-only.yml`
- `.github/workflows/workmate-ci-tests.yml`
- `.github/workflows/workmate-nightly-e2e.yml`

## MCP Pilot Quickstart (Read-Only)

Pilot artifacts:
- Registry: `../mcp/registry.json` (repo root)
- Decision: `../ai-context/decisions/DR-006-mcp-readonly-pilot.md`
- Baseline/results: `../docs/mcp-pilot/`
- Ops runbook: `docs/agent-ops-runbook.md`

Commands (from repo root):

```powershell
pwsh -File scripts/mcp/start-pilot.ps1
pwsh -File scripts/mcp/verify-readonly.ps1
pwsh -File scripts/mcp/daily-report.ps1 -Baseline
pwsh -File scripts/mcp/daily-report.ps1
pwsh -File scripts/mcp/bootstrap.ps1
```

Notes:
- If GitHub CLI is missing, baseline/report files are still generated with blocked status.
- Write-intent MCP actions are blocked and logged in `logs/mcp-readonly-violations.log`.

## Documentation

- Active docs: `docs/`
- Archived handover prompts: `docs/archive/`
