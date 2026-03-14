# WorkMate AI Agents — Canonical Rules

> **This is the single source of truth for AI rules, guardrails, and frozen decisions.**
>
> Conflict resolution priority: **this file > PROJECT_CONTEXT.md > relevant DR file > all other docs**.
>
> If any other file contradicts this file, this file wins. Update the other file, not this one.

---

## 1. Document Precedence

### What to read (session startup order)

1. `ai-context/context/agents.md` — this file (rules + frozen decisions)
2. `ai-context/context/PROJECT_CONTEXT.md` — current project state, architecture, env
3. `ai-context/decisions/index.md` — active decision record index
4. `ai-context/prompts/session-bootstrap.md` — session entry point (what task to start with)
5. `marketplace/AGENTS.md` — tool auto-discovery pointer only

**Task-specific reads (only when relevant):**
- DB / migration work → also read `docs/DB_RUNBOOK.md`
- Launch / env / ops → also read `docs/PRODUCTION_LAUNCH.md`
- Architecture health check → also read `docs/ARCHITECTURE_REVIEW.md`
- Env var reference → `docs/SECRETS_MAP.md`

### What NOT to read as a rule source

| File | Status | Use instead |
|------|--------|-------------|
| `ai-context/prompts/claude-guidelines.md` | ARCHIVED (legacy CLAUDE.md) | This file |
| `ai-context/context/compliance-rules.md` | ARCHIVED (content merged into section 2) | Section 2.1–2.2 of this file |
| `ai-context/memory/checkpoints/*` | Historical — read-only | `ai-context/context/PROJECT_CONTEXT.md` |
| `docs/strategy/*` | Historical reports | Not needed for development |
| `.claude/skills/*/SKILL.md` | Task workflow guides | For task-specific workflows only — not global rules |

---

## 2. Non-Negotiable Guardrails

These apply to every single change — no exceptions without a Decision Record.

### 2.1 Language and jurisdiction

- **English only** — all user-facing and developer-facing content. No Turkish or other languages in UI strings, docs, errors, or policies.
- **Ireland-first** — product, legal, payments, onboarding, verification, and dispute logic follow Ireland context. If a request conflicts with Ireland compliance, stop and raise a warning before implementation.
- **Policy writing** — do not copy competitor legal text verbatim. Use neutral wording. Prefer official Irish/EU references (DPC, Revenue, Irish consumer guidance).
- **Terminology** — use PPSN in Irish tax contexts (not generic "tax ID"). Correct incorrect terminology before proceeding. TIN handling must support non-PPSN users where applicable.

### 2.2 Ireland validation baseline

- Enforce Eircode validation in all job-posting and address flows.
- Enforce Irish phone normalisation to `+353XXXXXXXXX`, valid prefixes: `83, 85, 86, 87, 89`.
- Do not accept generic EU/UK postal or phone formats as Irish-valid.
- GDPR obligations and retention workflows are mandatory in architecture decisions.
- For compliance-sensitive releases: require QA + compliance review before merge.

### 2.3 Architecture and code quality

- Remove dead/unused code paths when safely confirmed.
- Keep source of truth centralised (taxonomy, constants, validation, policy links).
- Avoid duplicate UI systems and parallel legacy components.
- **Pre-commit hooks** (Husky + lint-staged) MUST run `npm run lint` + type-check on every commit. Do NOT bypass with `--no-verify` unless user explicitly approves.
- Commit messages must be explicit and scoped.

### 2.4 Change quality gates

Before every commit:
- `npm run lint`
- `npm run test`

Before every merge (PR gate):
- Playwright visual/smoke tests must pass
- Lighthouse CI check must pass

### 2.5 Delivery behaviour

If a requested change is risky or non-compliant:
1. Explain why (short and concrete).
2. Provide a compliant alternative.
3. Ask for confirmation only if the path forward is genuinely ambiguous.

### 2.6 Flow maturity execution order

Follow flow modernisation order strictly:
1. Provider funnel
2. Trust / policy / dispute certainty
3. Ops reliability and telemetry

Do not start telemetry-heavy work before provider funnel and trust policy contracts are in place.

### 2.7 UI architecture

- No new raw page-level CSS for visual redesign work unless shared tokens/components are insufficient.
- Prefer centralised design tokens in `app/globals.css` and shared primitives in `components/ui/*`.
- If a new visual primitive is required, add it once to the shared layer — reuse across pages.
- Shadcn/Radix primitives are allowed inside `components/ui/*` wrappers — do not scatter them across page files.
- Keep colour/spacing/radius/shadow decisions mapped to `--wm-*` tokens.
- Readability-first contrast: text on light surfaces must use `--wm-text-muted` or darker. Never use reduced opacity text (`text-white/..`, `opacity-..`) on light cards/sections.
- Every new section must pass a manual readability check at 100% and 125% zoom before merge.

---

## 3. Technical Guardrails (Enforced — no exceptions)

### 3.1 Supabase client — STRICT import rule

**NEVER** call `getSupabaseBrowserClient()` at module scope or as a top-level export.
**ALWAYS** call it inside an async function or `useEffect` callback, immediately before use.
**NEVER** import from `@/lib/supabase` — that file was deleted. Valid imports only:

| Context | Import |
|---------|--------|
| Client component (`'use client'`) | `import { getSupabaseBrowserClient } from '@/lib/supabase/client'` |
| Server component / page | `import { getSupabaseServerClient } from '@/lib/supabase/server'` |
| Route handler | `import { getSupabaseRouteClient } from '@/lib/supabase/route'` |
| Admin / service-role bypass | `import { getSupabaseServiceClient } from '@/lib/supabase/service'` |

```tsx
// FORBIDDEN — hydration errors and shared state bugs:
const supabase = getSupabaseBrowserClient(); // at module scope

// CORRECT:
useEffect(() => {
  const load = async () => {
    const supabase = getSupabaseBrowserClient();
    ...
  };
  load();
}, []);
```

### 3.2 Locale routing — STRICT path rule

**NEVER** hardcode `/en/` in any `href`, `redirect()`, or `router.push()` call.
**ALWAYS** use locale-aware helpers from `@/lib/i18n/locale-path`:
- `getLocaleRoot(pathname)` — extracts `/en` from current path
- `withLocalePrefix(localeRoot, '/target-path')` — builds correct locale-prefixed URL

```tsx
// FORBIDDEN:
redirect('/en/dashboard/customer');

// CORRECT:
const localeRoot = getLocaleRoot(pathname);
router.push(withLocalePrefix(localeRoot, '/dashboard/customer'));
```

### 3.3 Money — STRICT currency rule

- All monetary values stored and passed as **integer cents** in EUR only.
- Column names must end in `_amount_cents` (e.g. `quote_amount_cents`, `payment_amount_cents`).
- **NEVER** store or pass floats for money. **NEVER** assume any currency other than EUR.
- Display only: `Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })`.

### 3.4 Database — STRICT RLS rule

- Every new table **must** have RLS enabled and explicit policies.
- **NEVER** add `FOR ALL USING (true)` — this bypasses security entirely.
- Every migration must be additive — never rewrite or renumber existing files.
- **Next migration number: 082** — check `marketplace/migrations/` before creating any new migration.
- Migrations are applied manually in Supabase SQL Editor — do not attempt CLI apply.

### 3.5 Zod — API validation rule

- `z.record()` requires **two** arguments: `z.record(z.string(), z.string())` — NOT `z.record(z.string())`.
- All API route inputs must be validated with Zod schemas in `lib/validation/<domain>.ts` (see DR-010).
  Domain files: `auth`, `jobs`, `quotes`, `billing`, `disputes`, `admin`, `profile`, `search`,
  `availability`, `dashboard`, `notifications`, `analytics`, `ai`, `webhooks`.
- `lib/validation/api.ts` is a **re-export barrel only** — never add new schema definitions there.
- Do not add inline ad-hoc Zod schemas inside route handlers.

### 3.6 Dashboard widget system — STRICT extension rule

- Widget types defined in `lib/dashboard/widgets.ts` (`WidgetType`, `DashboardMode`, allowed/default config).
- All dashboard pages must use `<DashboardShell mode="..." />` — never build a monolithic page component.
- New widget cards go in `components/dashboard/widgets/` and must be registered in `WidgetRenderer.tsx`.
- Do not add widget logic directly to dashboard page files.

### 3.7 Webhook and public API rules

- Webhooks: HTTPS delivery only. Signed with HMAC-SHA256 via `X-WorkMate-Signature`. Implementation in `lib/webhook/send.ts`.
- Public API auth: `x-api-key` header → `profiles.api_key` lookup. Implementation in `lib/api/public-auth.ts`.
- Do not create new public endpoints outside `app/api/public/v1/` without explicit approval.

### 3.8 Ireland validation rules

- Eircode: enforce validation in all job-posting and address flows.
- Irish phone: normalise to `+353XXXXXXXXX`, valid prefixes: 83, 85, 86, 87, 89.
- Do not accept generic EU or UK phone/postal formats as valid Irish inputs.

### 3.9 Skill activation guide

When working in these areas, activate the matching skill first:

| Area | Skill |
|------|-------|
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
| AI route / lib/ai/ integration | `workmate-ai-integration` |
| Frozen decision check / architecture audit | `workmate-schema-guardian` |

### 3.10 MCP security note

- `gitmcp.io` is public-repo context tooling by default — do not assume private-repo support.
- Never include secrets/tokens/credentials in tracked files.
- Never expose internal-only compliance or ops notes without review.
- Before enabling GitMCP: run security preflight, verify `.env*` and keys are excluded.
- `21st.dev/magic` output is untrusted until reviewed — wrap to WorkMate shared UI layer and `--wm-*` token contract.

---

## 4. Repository Structure Rules

### 4.1 Ireland-specific logic → `lib/ireland/`

- Eircode: `lib/ireland/eircode.ts` — NEVER create a new `lib/eircode.ts`
- Irish phone: `lib/ireland/phone.ts` — NEVER create a new `lib/validation/phone.ts`
- County coordinates: `lib/ireland/coordinates.ts`
- Location/county mappings: `lib/ireland/locations.ts`
- New Ireland-specific logic (VAT, Revenue, PSC): add to `lib/ireland/`

### 4.2 Static data and enums → `lib/data/`

- Category definitions: `lib/data/categories.ts`
- Service taxonomy: `lib/data/services.ts`
- Provider document types: `lib/data/documents.ts`
- Budget options: `lib/data/budgets.ts`
- New static data/enums: add to `lib/data/`

### 4.3 Stripe SDK → `lib/stripe/`

- Stripe client: `lib/stripe/client.ts` — NEVER create a new `lib/stripe.ts` at root.
- New Stripe-related logic: add to `lib/stripe/`.

### 4.4 Component domain boundaries

Components MUST live in their feature directory, NOT in `dashboard/`:
- Job-related: `components/jobs/`
- Quote/offer-related: `components/offers/`
- Review-related: `components/reviews/`
- `components/dashboard/` is ONLY for dashboard-specific layout, widgets, and analytics panels.
- `components/ui/` is ONLY for design system primitives — no business logic, no data fetching.

### 4.5 No orphaned files in `lib/` root

- `lib/` root should ONLY contain `live-services.ts` (master switch) and `i18n.ts`.
- All other utilities MUST be in a subdirectory (`lib/ireland/`, `lib/data/`, `lib/stripe/`, etc.).

### 4.6 Barrel exports — keep current

- `components/ui/index.ts` — exports all UI primitives. Update when adding new ones (FD-20).
- `lib/ireland/index.ts` — exports all Ireland logic.
- `lib/data/index.ts` — exports all static data.

---

## 5. Process Rules

Mandatory process rules. These govern how work is done, not what the architecture is.

### 5.1 Branching — AI agents MUST NOT commit to `main`

- **Default**: create a feature branch: `feat/<desc>`, `fix/<desc>`, `chore/<desc>`, `docs/<desc>`.
- **Exception**: the user may explicitly request a direct commit to `main` — honour that instruction.
- **Only the repository owner** (user) can merge branches into `main`.
- Check branch before starting: `git branch --show-current`.
- **NEVER** run `git push origin main`.

### 5.2 Documentation — no agent self-reports

- **NEVER** create `*REPORT*.md`, `*COMPLETION*.md`, `*GUIDE*.md`, `*AUDIT*.md` in `docs/` or repo root.
- Allowed in `docs/`: architectural/operational docs only (ARCHITECTURE_REVIEW.md, PRODUCTION_LAUNCH.md, DB_RUNBOOK.md, ROPA.md, SECRETS_MAP.md).
- **Exception (DR-009):** Temporary analysis files may be written to `ai-reports/` (gitignored, never committed).
- Communicate what you did via PR description and commit messages — not separate files.

### 5.3 Skill creation — whitelist required

- Skills live in `.claude/skills/<skill-name>/SKILL.md`.
- `.gitignore` blocks ALL skills by default — new skills MUST be explicitly whitelisted in `.gitignore`.
- Always create skills on a feature branch (5.1 applies). Include the `.gitignore` change in the same PR.

### 5.4 File deletion protocol — MANDATORY before deleting any file

Before deleting any file, you MUST complete all steps:

1. **Read the file first** — a file is not a duplicate just because another looks similar.
2. **Verify with evidence** — for framework behaviour claims, cite official docs or source code. For "duplicate file" claims, read both files side-by-side.
3. **Check frozen decisions table** (section 6) — if the file appears there, stop immediately.
4. **Check git history** — `git log --all --oneline -- <filepath>`. If a delete→restore cycle exists, investigate before acting.
5. **Ask the user** — state what the file does, why it should be deleted, what evidence you have, what will break if wrong.

**NEVER delete silently as part of a larger commit.**

### 5.5 Git log reading standard

AI-authored commit messages CAN be factually wrong. Apply these rules:

- Treat AI commit messages as **claims, not facts**. Verify framework behaviour claims against official docs or source code.
- A "fix" commit may have introduced a regression — always check for subsequent restore commits.
- `Co-Authored-By: Claude` in the commit trailer = AI wrote or heavily influenced this commit. Apply scepticism to framework behaviour claims.
- If `git log --all -- <file>` shows a delete→restore cycle: read both the delete commit AND the restore commit. Reproduce the actual error before acting.

**Known cycle in this repo:**
- `middleware.ts` was deleted and restored multiple times. **Final correct state (session 38):** `middleware.ts` MUST exist with `export async function middleware(...)`. `proxy.ts` was a false belief — Next.js never read it as middleware. `proxy.ts` has been permanently deleted. See FD-28.

---

## 6. Frozen Decisions (FD-01 — FD-30)

> These decisions are locked. Do not change without writing a Decision Record.
>
> **How to propose a change:**
> ```
> DR-XXX | Date | Author | Decision changed | Reason | Approved by
> ```

| ID | Frozen Decision | Status | Why it exists |
|----|----------------|--------|---------------|
| FD-01 | Zod schemas in domain files under `lib/validation/<domain>.ts` — never inline in route files. `lib/validation/api.ts` is a re-export barrel only; never add new schema definitions there. See DR-010. | 🟡 Updated (DR-010, S41) | Domain split for scalability; api.ts retained as backward-compat barrel |
| FD-02 | `loading.tsx` required on pages with async Supabase/DB calls. Exempt: static pages with only `getTranslations()`. See DR-008. | 🟢 Active | No blank screens on data-fetching navigation |
| FD-03 | Colors/spacing/radius/shadows must map to `--wm-*` tokens; wrapper internals may use Shadcn/Radix primitives | 🟢 Active | Brand identity preserved while enabling modern primitive internals |
| FD-04 | `<Button>` wrapper always — never raw `<button>` or `<Link>` with bg- classes. **Exempt**: icon toggles (ThemeToggle, hamburger), drag handles, and other micro-interaction controls where `<Button>` variant/size/padding is unsuitable. | 🟡 Updated (S41) | Stable app-level API; icon toggles get flexibility |
| FD-05 | `<PageHeader>` required on all top-level page routes — no raw Card+h1. **Exempt**: modal contents, wizard steps, widget inner views, sub-route tabs inside a page that already has a PageHeader. See DR-011. | 🟡 Updated (DR-011, S41) | Scope narrowed to top-level pages; modal/wizard DX improved |
| FD-06 | `<EmptyState>` on every list — always handle zero-item state | 🟢 Active | No blank/broken UIs on empty data |
| FD-07 | Responsive grid default: `sm:grid-cols-2 lg:grid-cols-3` on card lists. Override allowed for admin dashboards, fluid layouts, or wide-card lists — must include a `{/* DR-011: reason */}` comment. See DR-011. | 🟡 Updated (DR-011, S41) | Grid density flexibility for dashboard contexts; default preserved |
| FD-08 | Supabase per-context clients — NEVER module-scope singleton. `getSupabaseServiceClient()` (RLS bypass) is restricted to: (a) admin routes behind `ensureAdminRoute()`, (b) webhook handlers after signature verification, (c) system-level background tasks (notifications, audit, idempotency), (d) public API v1 routes behind `authenticatePublicRequest()`, (e) read-only public endpoints returning only non-sensitive fields. All other queries MUST use `getSupabaseRouteClient()` or `getSupabaseServerClient()`. | 🟡 Updated (S42 audit) | Prevents hydration errors, shared state bugs, SSR leaks; service role usage now explicitly scoped |
| FD-09 | Money always as integer cents (`*_amount_cents`), EUR only | 🟢 Active | Float rounding prevention; Irish jurisdiction requirement |
| FD-10 | RLS never `FOR ALL USING (true)` — all policies scoped to `auth.uid()` | 🟢 Active | Security — open policies expose all rows to all authenticated users |
| FD-11 | No hardcoded `/en/` in hrefs, redirects, or router.push — use `lib/i18n/locale-path` helpers | 🟢 Active | Locale routing correctness; future locale expansion readiness |
| FD-12 | Webhook delivery: HTTPS-only, HMAC-SHA256 via `X-WorkMate-Signature` from `lib/webhook/send.ts` | 🟢 Active | Security — unsigned webhooks are spoofable |
| FD-13 | Contrast: text on light surfaces must use semantic text tokens (`--wm-text-strong/default/muted/soft`) — never low-opacity hacks | 🟢 Active | Prevents recurring unreadable UI regressions |
| FD-14 | Light is default (`<html data-theme="light">` in layout.tsx). Dark mode supported via `[data-theme="dark"]`. Never use Tailwind `dark:` utilities — `--wm-*` tokens only. All component changes must pass visual QA in both modes. See DR-007. | 🟡 Updated (DR-007, S39) | Dark mode fully supported since UI overhaul 2026-03-12 |
| FD-15 | No page/container-level opacity on readable content wrappers (`main`, `section`, hero/content cards) — except loading/skeleton states | 🟢 Active | Prevents whole-screen faded text incidents |
| FD-16 | Ireland-specific logic MUST live in `lib/ireland/` — never at `lib/` root | 🟢 Active | Session 27 restructure — prevents re-scattering of domain logic |
| FD-17 | Static data/enums MUST live in `lib/data/` — never at `lib/` root | 🟢 Active | Session 27 restructure |
| FD-18 | Stripe SDK MUST live in `lib/stripe/client.ts` — never as `lib/stripe.ts` | 🟢 Active | Session 27 restructure |
| FD-19 | Feature components in domain dir (`jobs/`, `offers/`, `reviews/`) — NOT in `dashboard/` | 🟢 Active | Session 27 restructure — prevents dashboard/ becoming a catch-all |
| FD-20 | `components/ui/index.ts` barrel export updated when adding new UI primitives | 🟢 Active | Session 27 — barrel export exists, keep it current |
| FD-21 | No orphaned files in `lib/` root (except `live-services.ts`, `i18n.ts`) | 🟢 Active | Session 27 restructure |
| FD-22 | Pre-commit hooks (Husky + lint-staged) MUST NOT be bypassed with `--no-verify` | 🟢 Active | Quality gates must run locally |
| FD-26 | `next/image` for known-size, long-lived remote URLs (Supabase Storage avatars, portfolio images, etc.) — raw `<img>` is allowed for: blob/object URLs, signed/temporary URLs, dynamic document previews, and Leaflet contexts. Every intentional `<img>` MUST have an `// eslint-disable-next-line @next/next/no-img-element` comment explaining why. | 🟢 Active | Session 34 — performance + LCP; refined after code audit confirmed signed-URL and preview exceptions |
| FD-27 | `lib/api/error-response.ts` helpers in all API routes — no raw `NextResponse.json` for errors | 🟢 Active | Session 35 — consistent error shape |
| FD-28 | **`middleware.ts` is the sole Next.js middleware entry point. `proxy.ts` MUST NOT exist.** Prior belief that proxy.ts was the Next.js 16 entry point was false — Next.js only reads middleware.ts. Auth guard + locale routing were silently not running. Fixed session 38. | 🔴 Critical | Session 38 — confirmed by Next.js spec + code analysis |
| FD-29 | **No premature deletion of "dead" code.** Before removing an unused function or module, verify it is not pre-built infrastructure awaiting integration. Checklist: (1) Was it added in a recent hardening/foundation session? (2) Does a TODO, design doc, or audit report reference it as planned work? (3) Would a near-future feature (dashboard, observability, fallback) need it? If any answer is yes → wire it instead of deleting it. Only delete if the function is a true duplicate of an existing, actively-used alternative. | 🟢 Active | Session 42 — logAiCall() was incorrectly deleted as dead code; it was pre-built AI observability infrastructure |
| FD-30 | **CSP strict-dynamic, no unsafe-eval.** Script-src uses `'strict-dynamic'` to neutralize `'unsafe-inline'` in CSP3 browsers. `'unsafe-eval'` is permanently banned from all CSP directives. | 🟢 Active | Security audit — unsafe-eval removed, strict-dynamic added for defense-in-depth |

> **Note:** FD-23 (feature branch requirement), FD-24 (no agent self-reports), and FD-25 (skill whitelist) are now maintained as **process rules** in section 5 above, not as architecture frozen decisions.

**Decision Records (changes to frozen decisions):**
- FD-02 (DR-008, S39): Scope narrowed — `loading.tsx` exempt on static pages with only `getTranslations()`.
- FD-14 (DR-007, S39): Expanded — dark mode now supported via `[data-theme="dark"]`.
- FD-28 (S38): Reversed — proxy.ts belief was wrong; middleware.ts restored as sole entry point, proxy.ts permanently deleted.
- FD-01 (DR-010, S41): Domain split — `api.ts` becomes re-export barrel; schemas live in `lib/validation/<domain>.ts`.
- FD-05 (DR-011, S41): Scope narrowed — `<PageHeader>` exempt in modals, wizard steps, widget inner views.
- FD-07 (DR-011, S41): Override allowed — non-default grid column counts allowed with inline comment.
- FD-29 (S42): New — "no premature deletion" rule after logAiCall() was incorrectly classified as dead code.

---

## 7. Decision Record Process

When a change to a frozen decision is genuinely needed:

1. Write a DR in `ai-context/decisions/DR-XXX-description.md`.
2. Add the DR to `ai-context/decisions/index.md`.
3. Update the affected FD row in section 6 of this file (add status 🟡 Updated + DR reference).
4. Update the DR references in `ai-context/context/PROJECT_CONTEXT.md`.
5. Get user approval before proceeding with the change.

---

## 8. When To Read Extra Docs

| Task type | Additional read |
|-----------|----------------|
| DB migration / RLS / schema | `docs/DB_RUNBOOK.md` |
| Production launch / env vars | `docs/PRODUCTION_LAUNCH.md` |
| Architecture health check | `docs/ARCHITECTURE_REVIEW.md` |
| Env var reference | `docs/SECRETS_MAP.md` |
| Decision record detail | `ai-context/decisions/DR-XXX.md` (read only the relevant one) |

All other files are either archived or scope-specific. See section 1 for what NOT to read as a rule source.

---

## Appendix A — Legacy Agent Roles (DEPRECATED)

> These role definitions existed in earlier sessions when a multi-agent orchestration was being explored.
> The roleplay model was abandoned. Content is preserved here for historical context only.
> **Do not activate or reference these in development work.**

**ProjectManager** — Coordinates all 7 other agents. Read/update PROJECT_CONTEXT.md. Track Production Launch Checklist. No change without ComplianceAgent + QAAgent approval.

**DesignAgent** — Apple-level Premium UI Expert. Generous whitespace, soft shadows, green accent (#10b981), Framer Motion spring animations.

**FrontendAgent** — Next.js 16 + React 19 + Tailwind + shadcn/ui + Framer Motion expert.

**BackendAgent** — Supabase + PostgreSQL + RLS + Edge Functions + Migration expert.

**FintechAgent** — Stripe Connect expert. Secure Hold, Capture, rebooking 1.9% logic, and webhooks.

**ComplianceAgent** — Ireland Compliance Guardian. SafePass, €6.5M Insurance, Tax Clearance, GDPR, Eircode, RLS.

**QAAgent** — QA & Testing expert. Vitest + Playwright for every new feature.

**DevOpsAgent** — Vercel + Production + Env + Deployment expert.
