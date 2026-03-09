# WorkMate AI Canonical Agents and Guardrails

This is the canonical AI rules file for this repository.

Canonical paths:
- `ai-context/context/PROJECT_CONTEXT.md`
- `ai-context/context/agents.md`
- `ai-context/context/compliance-rules.md`
- `ai-context/prompts/session-bootstrap.md`

---

## Custom Agent Roles
# WorkMate Custom Agents

These agents are part of the WorkMate 8-Agent Team.

=== ProjectManager ===
You are the official Project Manager of WorkMate (Ireland services marketplace). You coordinate all other 7 agents. Always read and update `ai-context/context/PROJECT_CONTEXT.md`. Distribute tasks, track Production Launch Checklist, and never allow any change without ComplianceAgent and QAAgent approval.

=== DesignAgent ===
You are the Apple-level Premium UI Expert. Always design with generous whitespace, soft shadows, green accent (#10b981), Framer Motion spring animations. Reference the MacBook dashboard image the user previously shared.

=== FrontendAgent ===
You are the Next.js 16 + React 19 + Tailwind + shadcn/ui + Framer Motion expert. Build clean, responsive, accessible components.

=== BackendAgent ===
You are the Supabase + PostgreSQL + RLS + Edge Functions + Migration expert. Always follow migration numbering (050+) and create full RLS policies.

=== FintechAgent ===
You are the Stripe Connect expert. Handle Secure Hold, Capture, rebooking 1.9% logic, and webhooks.

=== ComplianceAgent ===
You are the Ireland Compliance Guardian. Check every change for SafePass, €6.5M Insurance, Tax Clearance, GDPR, Eircode, and RLS compliance. Never approve without full check.

=== QAAgent ===
You are the QA & Testing expert. Write and run Vitest + Playwright tests for every new feature.

=== DevOpsAgent ===
You are the Vercel + Production + Env + Deployment expert.

---

## Guardrails and Technical Rules
# WorkMate Guardrails (Permanent)

These rules are mandatory for every change in this project.

## 1) Language policy
- All user-facing and developer-facing content must be in English only.
- Do not add Turkish or any other language to UI strings, docs, errors, or policies.

## 2) Jurisdiction policy
- WorkMate is Ireland-first. Product, legal, payments, onboarding, verification, and dispute logic must follow Ireland context.
- If a request conflicts with Ireland compliance or introduces legal risk, stop and raise a warning before implementation.

## 3) Safety policy for policy/legal text
- Do not copy competitor legal text verbatim.
- Use policy-safe, neutral wording and adapt to WorkMate operations.
- Prefer official Irish/EU references for compliance-sensitive content (e.g., DPC, Revenue, Irish consumer guidance).

## 4) Verification and tax terminology
- Use correct Ireland terminology:
  - PPSN (Ireland), not generic assumptions.
  - TIN handling must support non-PPSN users via valid alternatives where applicable.
- If terminology in a request is incorrect, correct it first, then proceed.

## 5) Architecture and cleanliness
- Remove dead/unused code paths when safely confirmed.
- Avoid duplicate UI systems and parallel legacy components.
- Keep source of truth centralized (taxonomy, constants, validation, policy links).

## 6) Change quality gates
- Before commit:
  - `npm run lint`
  - `npm run test`
- Before merge (PR gate, mandatory):
  - Backstop visual regression check must pass
  - Lighthouse CI check must pass
- Keep commit messages explicit and scoped.

## 7) Delivery behavior
- If a requested change is risky/non-compliant:
  - Explain why (short and concrete),
  - Provide a compliant alternative,
- Ask for confirmation only if needed.

## 7.1) Flow maturity execution order
- Follow flow modernization order strictly:
  1) Provider funnel
  2) Trust/policy/dispute certainty
  3) Ops reliability and telemetry
- Do not start telemetry-heavy work before provider funnel and trust policy contracts are in place.
- Source roadmap: `marketplace/docs/flow-maturity-roadmap-10w.md`

## 8) UI architecture rule
- No new raw page-level CSS for visual redesign work unless shared tokens/components are insufficient.
- Prefer centralized design tokens in `app/globals.css` and shared primitives in `components/ui/*`.
- If a new visual primitive is required, add it once to the shared layer and reuse it across pages.
- Hybrid UI boundary is allowed:
  - Shadcn/Radix primitives are allowed inside `components/ui/*` wrappers.
  - Do not scatter primitive-specific utility patterns directly across page files.
  - Keep color/spacing/radius/shadow decisions mapped to `--wm-*` tokens.
- Readability-first contrast is mandatory:
  - On light surfaces, body/supporting text must use `--wm-text-muted` or darker.
  - Never use reduced opacity text (`text-white/..`, `opacity-..`) on light cards/sections.
  - Any new section must pass a manual readability check at 100% and 125% zoom before merge.

---

# Technical Guardrails (Enforced — no exceptions)

## 9) Supabase client — STRICT import rule
- **NEVER** call `getSupabaseBrowserClient()` at module scope or as a top-level export.
- **ALWAYS** call it inside an async function or `useEffect` callback, immediately before use.
- **NEVER** import from `@/lib/supabase` — that file was deleted. The only valid imports are:
  - Client components: `import { getSupabaseBrowserClient } from '@/lib/supabase/client'`
  - Server components / route handlers: `import { getSupabaseServerClient } from '@/lib/supabase/server'`
  - Route handlers (alternative): `import { getSupabaseRouteClient } from '@/lib/supabase/route'`
  - Service role (admin only): `import { getSupabaseServiceClient } from '@/lib/supabase/service'`

```tsx
// FORBIDDEN — will cause hydration errors and shared state bugs:
const supabase = getSupabaseBrowserClient(); // at module scope
export const supabase = getSupabaseBrowserClient(); // as export

// CORRECT:
useEffect(() => {
  const load = async () => {
    const supabase = getSupabaseBrowserClient(); // inside callback
    ...
  };
  load();
}, []);
```

## 10) Locale routing — STRICT path rule
- **NEVER** hardcode `/en/` in any `href`, `redirect()`, or `router.push()` call.
- **ALWAYS** use locale-aware helpers from `@/lib/i18n/locale-path`:
  - `getLocaleRoot(pathname)` — extracts `/en` or `/ga` from current path
  - `withLocalePrefix(localeRoot, '/target-path')` — builds correct locale-prefixed URL
- All routed pages must live under `app/[locale]/`. No pages under `app/` directly (except `layout.tsx`, `globals.css`, `auth/callback/`).

```tsx
// FORBIDDEN:
redirect('/en/dashboard/customer');
router.push('/en/login');

// CORRECT:
const pathname = usePathname();
const localeRoot = getLocaleRoot(pathname);
router.push(withLocalePrefix(localeRoot, '/dashboard/customer'));
```

## 11) Money — STRICT currency rule
- All monetary values are stored and passed as **integer cents** in EUR only.
- Column names must end in `_amount_cents` (e.g., `quote_amount_cents`, `payment_amount_cents`).
- **NEVER** store or pass floats for money. **NEVER** assume any currency other than EUR.
- Display only: divide by 100 and format with `Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })`.

## 12) Database — STRICT RLS rule
- Every new table **must** have RLS enabled and explicit policies.
- **NEVER** add `FOR ALL USING (true)` — this bypasses security entirely.
- Every migration must be additive (001, 002… never rewrite or renumber existing files).
- Next migration number: **059** — check `migrations/` before creating any new migration.
- Migrations are applied manually by the user in Supabase SQL Editor — do not attempt to run them via CLI.

## 13) Zod — API validation rule
- `z.record()` requires **two** arguments: `z.record(z.string(), z.string())` — NOT `z.record(z.string())`.
- All API route inputs must be validated with Zod schemas defined in `lib/validation/api.ts`.
- Do not add inline ad-hoc Zod schemas inside route handlers — extend the shared file.

## 14) Dashboard widget system — STRICT extension rule
- Widget types are defined in `lib/dashboard/widgets.ts` (`WidgetType`, `DashboardMode`, allowed/default config).
- All dashboard pages must use `<DashboardShell mode="..." />` — never build a monolithic page component.
- New widget cards go in `components/dashboard/widgets/` and must be registered in `WidgetRenderer.tsx`.
- Do not add widget logic directly to dashboard page files.

## 15) Webhook and public API rules
- Webhooks: HTTPS delivery only. Signed with HMAC-SHA256 via `X-WorkMate-Signature` header. Implementation in `lib/webhook/send.ts`.
- Public API auth: `x-api-key` header → `profiles.api_key` lookup. Implementation in `lib/api/public-auth.ts`.
- Do not create new public endpoints outside `app/api/public/v1/` without explicit approval.

## 16) Ireland validation rules
- Eircode: enforce validation in all job-posting and address flows.
- Irish phone: normalize to `+353XXXXXXXXX`, valid prefixes: 83, 85, 86, 87, 89.
- Do not accept generic EU or UK phone/postal formats as valid Irish inputs.

## 17) Skill activation guide
When working on these areas, activate the matching skill first:
- Skill locations:
  - Repo-local WorkMate skills: `.claude/skills/workmate-*` and `.claude/skills/ui-system-hybrid-migration`
  - Codex global skills: `~/.codex/skills/*`

| Area | Skill to activate |
|------|-------------------|
| New migration / RLS policy | `supabase-migration-guardian` |
| Payment / Stripe / webhook / dispute | `stripe-connect-payment-ops` |
| Provider onboarding / admin review flow | `provider-onboarding-qa-ie` |
| Admin dashboard regression | `admin-dashboard-live-qa` |
| Task alert RLS or match flow | `task-alerts-rls-smoke` |
| Locale route or `[locale]` path issue | `locale-route-guard-next-intl` |
| Hybrid UI migration and wrapper strategy | `ui-system-hybrid-migration` |
| Visual QA and regression gate workflow | `workmate-visual-qa` |
| New API route handler | `workmate-api-route` |
| New dashboard widget | `workmate-dashboard-widget` |
| Production launch / env vars / go-live | `workmate-production-launch` |
| Seed data / demo accounts | `workmate-seed-ireland` |
| General project rules + guardrails | `workmate-core` |
| Frozen decision check / architecture audit | `workmate-schema-guardian` |

## 17.1) MCP pilot matrix (DR-006)

Read-only pilot matrix:

| Agent role | Allowed MCP | Allowed capabilities | Forbidden capabilities |
|---|---|---|---|
| ProjectManager | GitHub | read PRs, read issues, read checks/workflows | create/update issues, merge, label write |
| QAAgent | GitHub | read check runs, read failed jobs, read PR test context | rerun workflows, PR write actions |
| BackendAgent | Supabase | read schema metadata, read RLS policies, read query diagnostics | any SQL mutation, migration apply, table writes |
| ComplianceAgent | Supabase | read verification/dispute/payment policy evidence | data mutation, policy writes |

MCP pilot rules:
- MCP runtime is local only.
- All MCP calls must pass `scripts/mcp/read_only_enforce.mjs`.
- Any blocked action must be logged to `logs/mcp-readonly-violations.log`.
- If fallback rate exceeds thresholds defined in DR-006, narrow scope immediately.

## 19) FROZEN DECISIONS — do not change without a Decision Record

The following architectural decisions are **locked**. They were established through deliberate analysis and must not be changed without writing a Decision Record directly in this section.

**Format for proposing a change:**
```
DR-XXX | Date | Author | Decision changed | Reason | Approved by
```

| # | Frozen Decision | Why it exists |
|---|----------------|---------------|
| FD-01 | All Zod schemas in `lib/validation/api.ts` — never inline in route files | Single source of truth; prevents schema drift; enables reuse across tests |
| FD-02 | `loading.tsx` on every data-fetching page under `app/[locale]/` | No blank screens on navigation; required by `ai-context/prompts/claude-guidelines.md` |
| FD-03 | Colors/spacing/radius/shadows must map to `--wm-*` tokens; wrapper internals may use Shadcn/Radix primitives | Preserves brand identity while enabling modern primitive internals |
| FD-04 | Keep wrapper API (`Button`, `Card`, `Badge`, etc.) as the page-facing contract | Stable app-level API, safer migration path, consistent behavior |
| FD-05 | `<PageHeader>` remains required at page top; avoid ad-hoc page-level style systems | Consistent page structure and reduced UI drift |
| FD-06 | `<EmptyState>` on every list — always handle zero-item state | No blank/broken UIs on empty data; consistent UX |
| FD-07 | Responsive grid default: `sm:grid-cols-2 lg:grid-cols-3` on all card lists | Mobile-first; prevents single-column desktop layouts |
| FD-08 | Supabase clients per-context — never a module-scope singleton | Prevents hydration errors, shared state bugs, SSR leaks |
| FD-09 | Money always as integer cents (`*_amount_cents`), EUR only | Prevents float rounding errors; Irish jurisdiction requirement |
| FD-10 | RLS never `FOR ALL USING (true)` — all policies scoped to `auth.uid()` | Security — open policies expose all rows to all authenticated users |
| FD-11 | No hardcoded `/en/` in hrefs, redirects, or router.push — use `lib/i18n/locale-path` helpers | Locale routing correctness; future locale expansion readiness |
| FD-12 | Webhook delivery: HTTPS-only, HMAC-SHA256 via `X-WorkMate-Signature` from `lib/webhook/send.ts` | Security — unsigned webhooks are spoofable |
| FD-13 | Contrast contract: text on light surfaces must use semantic text tokens (`--wm-text-strong/default/muted/soft`), never low-opacity text color hacks | Prevents recurring unreadable UI regressions across pages |
| FD-14 | Theme application is explicit-only: light theme locked by default on `<html data-theme="light">`; no automatic `prefers-color-scheme` overrides in token source | Prevents accidental global washed-out/low-contrast regressions after unrelated changes |
| FD-15 | No page/container-level opacity on readable content wrappers (`main`, `section`, hero/content cards) except loading/skeleton states | Prevents whole-screen faded text incidents and preserves readability baseline |

**Decision Records (changes to frozen decisions):**
_(none yet — first change must be documented here before implementation)_

---

## 18) AI onboarding — mandatory reading order
Before making any change, a new AI agent must read these files in order:

1. `ai-context/context/PROJECT_CONTEXT.md` — single highest-density project reference
2. `ai-context/context/agents.md` — this file (immutable rules)
3. `~/.claude/projects/<project-slug>/memory/MEMORY.md` — session history and decisions
4. `.claude/skills/` (project root) — WorkMate specialist skills (`workmate-*`)
5. `marketplace/lib/auth/rbac.ts` — RBAC helpers
6. `marketplace/lib/dashboard/widgets.ts` — widget system source of truth
7. `marketplace/lib/i18n/locale-path.ts` — locale path helpers



