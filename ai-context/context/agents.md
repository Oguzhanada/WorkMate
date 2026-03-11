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
- Next migration number: **073** — check `migrations/` before creating any new migration.
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

## 17.2) MCP security note (GitMCP + Magic)
- `gitmcp.io` is public-repo context tooling by default; do not assume private-repo support.
- Treat all MCP-exposed repo content as externally consumable context:
  - never include secrets/tokens/credentials in tracked files,
  - never expose internal-only compliance or ops notes without review.
- Before enabling GitMCP on any repo:
  - run security preflight (`npm run check:prepublic-security` where applicable),
  - verify `.env*`, keys, and operational runbooks are excluded or sanitized,
  - require explicit security approval for any non-public or mixed-sensitivity repository.
- `21st.dev/magic` output is untrusted until reviewed:
  - generated UI must be wrapped/adapted to WorkMate shared UI layer,
  - generated code should prefer `--wm-*` token contract, but raw Tailwind utilities are allowed when reviewed.

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
| FD-16 | Ireland-specific logic MUST live in `lib/ireland/` — never at `lib/` root | Session 27 restructure — prevents re-scattering of domain logic |
| FD-17 | Static data/enums MUST live in `lib/data/` — never at `lib/` root or `lib/constants/` | Session 27 restructure — consolidates all enums/data in one place |
| FD-18 | Stripe SDK MUST live in `lib/stripe/client.ts` — never as `lib/stripe.ts` | Session 27 restructure — consistent with other integrations |
| FD-19 | Feature components in their domain dir (`jobs/`, `offers/`, `reviews/`) — NOT in `dashboard/` | Session 27 restructure — prevents dashboard/ becoming a catch-all |
| FD-20 | No orphaned files in `lib/` root (except `live-services.ts`, `i18n.ts`) | Session 27 restructure — all utilities must live in subdirectories |
| FD-21 | `components/ui/index.ts` barrel export must be updated when adding new UI primitives | Session 27 — barrel export exists, keep it current |
| FD-22 | Pre-commit hooks (Husky + lint-staged) must NOT be bypassed with `--no-verify` | Session 27 — quality gates must run locally |
| FD-23 | AI agents MUST work on feature branches — NEVER commit directly to `main` | Session 27 — main protection, user-only merge |
| FD-24 | AI agents MUST NOT create completion/audit/task report files (`*REPORT*.md`, `*COMPLETION*.md`, `*GUIDE*.md` at repo root or `docs/`) — only architectural/operational docs allowed | Session 28 — anti-doc-bloat, keep repo clean |
| FD-25 | New `.claude/skills/` MUST be whitelisted in `.gitignore` before commit — unwhitelisted skills are silently ignored by git | Session 28 — skill creation requires gitignore update |
| FD-26 | `next/image` for all static images — no raw `<img>` except blob/data URLs | Session 34 — performance + LCP |
| FD-27 | `lib/api/error-response.ts` helpers in all API routes — no raw `NextResponse.json` for errors | Session 35 — consistent error shape |
| FD-28 | **`middleware.ts` is the sole Next.js middleware entry point. `proxy.ts` MUST NOT exist.** Prior belief ("proxy.ts is the Next.js 16 entry point") was false — Next.js has never supported proxy.ts. The cited URL did not exist. proxy.ts was silently ignored: auth guard + locale routing not running. Fixed session 38: middleware.ts with `export async function middleware(...)`, proxy.ts deleted. | Session 38 — confirmed by Next.js spec + code analysis |

**Decision Records (changes to frozen decisions):**
- FD-28 (session 38): Reversed. proxy.ts → middleware.ts. Proof: Next.js only reads middleware.ts/middleware.js; proxy.ts had no default export and wrong function name; auth guard was silently not running.

---

## 20) Repository Structure — STRICT file organization rules (established session 27)

These rules protect the architectural reorganization completed in session 27. Violating these rules creates import chaos and merge conflicts.

### 20.1) Ireland-specific logic MUST live in `lib/ireland/`
- Eircode validation: `lib/ireland/eircode.ts` — NEVER create a new `lib/eircode.ts`
- Irish phone normalization: `lib/ireland/phone.ts` — NEVER create a new `lib/validation/phone.ts`
- County coordinates: `lib/ireland/coordinates.ts` — NEVER create a new `lib/ireland-coordinates.ts`
- Location/county mappings: `lib/ireland/locations.ts` — NEVER create a new `lib/ireland-locations.ts`
- New Ireland-specific logic (VAT, Revenue, PSC): add to `lib/ireland/`

### 20.2) Static data and enums MUST live in `lib/data/`
- Category definitions: `lib/data/categories.ts` — NEVER create a new `lib/marketplace-data.ts`
- Service taxonomy: `lib/data/services.ts` — NEVER create a new `lib/service-taxonomy.ts`
- Provider document types: `lib/data/documents.ts` — NEVER create a new `lib/provider-documents.ts`
- Budget options: `lib/data/budgets.ts` — NEVER create a new `lib/constants/job.ts`
- New static data/enums: add to `lib/data/`

### 20.3) Stripe SDK MUST live in `lib/stripe/`
- Stripe client: `lib/stripe/client.ts` — NEVER create a new `lib/stripe.ts` at root
- Stripe webhook handlers: `lib/stripe/handlers/` (when extracted)
- New Stripe-related logic: add to `lib/stripe/`

### 20.4) Component domain boundaries — STRICT ownership
Components MUST live in their feature directory, NOT in `dashboard/`:
- Job-related: `components/jobs/` (JobMessagePanel, JobPhotoUploader, JobContractPanel, etc.)
- Quote/offer-related: `components/offers/` (QuoteActions, etc.)
- Review-related: `components/reviews/` (LeaveReviewForm, etc.)
- `components/dashboard/` is ONLY for dashboard-specific layout, widgets, and analytics panels
- `components/ui/` is ONLY for design system primitives — no business logic, no data fetching

### 20.5) No orphaned files in `lib/` root
- `lib/` root should ONLY contain `live-services.ts` (master switch) and `i18n.ts`
- All other utilities MUST be in a subdirectory (`lib/ireland/`, `lib/data/`, `lib/stripe/`, etc.)
- If you need to add a new utility, create or use an appropriate subdirectory

### 20.6) Barrel exports exist — use them
- `components/ui/index.ts` — exports all UI primitives
- `lib/ireland/index.ts` — exports all Ireland logic
- `lib/data/index.ts` — exports all static data
- New barrel exports can be added, but existing imports via direct paths also remain valid

### 20.7) Pre-commit hooks are active
- Husky + lint-staged run ESLint + tsc on every commit
- Do NOT bypass with `--no-verify` unless explicitly approved by the user
- If a hook fails, fix the issue — do not disable the hook

### 20.8) Git branching — AI agents MUST NOT commit to `main` (FD-23)
- **NEVER** commit directly to the `main` branch
- **ALWAYS** create a feature branch before making changes:
  - `feat/<description>` — new features
  - `fix/<description>` — bug fixes
  - `chore/<description>` — maintenance, deps, config
  - `docs/<description>` — documentation only
- **Only the repository owner** (user) can merge branches into `main`
- Before starting work, check which branch you are on: `git branch --show-current`
- If you are on `main`, create a new branch first: `git checkout -b feat/<description>`
- **NEVER** run `git push origin main` — push your feature branch instead

### 20.9) Documentation policy — NO agent self-reports (FD-24)
- **NEVER** create `*REPORT*.md`, `*COMPLETION*.md`, `*GUIDE*.md`, `*AUDIT*.md` files
- These are agent self-reports and add no value — they bloat the repo
- The only allowed documentation in `docs/` is **architectural/operational**:
  - `ARCHITECTURE_REVIEW.md`, `PRODUCTION_LAUNCH.md`, `DB_RUNBOOK.md`, `ROPA.md`, checkpoints
- If you need to communicate what you did, use **PR description** and **commit messages** — not separate files
- Existing `PROJECT_CONTEXT.md` is the single onboarding reference — do not create duplicates
- The user will review and merge via PR or direct merge at their discretion

### 20.10) Skill creation — whitelist in `.gitignore` required (FD-25)
- Skills live in `.claude/skills/<skill-name>/SKILL.md`
- `.gitignore` blocks ALL skills by default (``.claude/skills/*``)
- Only **whitelisted** skills are committed. Current whitelist (9 skills):
  - `!.claude/skills/ui-system-hybrid-migration/`
  - `!.claude/skills/workmate-visual-qa/`
  - `!.claude/skills/workmate-schema-guardian/`
  - `!.claude/skills/workmate-core/`
  - `!.claude/skills/workmate-api-route/`
  - `!.claude/skills/workmate-dashboard-widget/`
  - `!.claude/skills/workmate-front-engineer/`
  - `!.claude/skills/workmate-production-launch/`
  - `!.claude/skills/workmate-seed-ireland/`
- **When creating a new skill**, you MUST also add whitelist entries to `.gitignore`:
  ```
  !.claude/skills/<new-skill-name>/
  !.claude/skills/<new-skill-name>/SKILL.md
  ```
- Without this step, your skill file will be silently ignored by git and **never committed**
- Always create skills on a **feature branch** (FD-23) and include the `.gitignore` change in the same PR

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

---

## 21) File deletion protocol — MANDATORY before deleting any file

Before deleting any file from this repository, the agent MUST complete all steps below.
Skipping even one step is a protocol violation.

### Step 1 — Read the file first
- Open and read the file before forming any opinion about it.
- A file is not a duplicate just because another file looks similar.

### Step 2 — Verify the claim with evidence
If you believe a file is unnecessary, duplicate, or conflicting, you MUST find concrete evidence:
- For framework behaviour claims (e.g. "Next.js uses X instead of Y"): cite the official docs URL or the relevant source code. If you cannot cite it, the claim is unverified — do not act on it.
- For "duplicate file" claims: read BOTH files. List what each one does. Confirm they are 100% identical in purpose before deleting either.
- For "this causes a conflict" claims: reproduce the actual error. A build warning or assumed conflict is not sufficient.

### Step 3 — Check the frozen decisions table (section 19)
If the file appears in the FD table, stop immediately. Frozen files cannot be deleted without a Decision Record approved by the user.

### Step 4 — Check git history for prior deletions
Run: `git log --all --oneline -- <filepath>`
If the file was previously deleted AND restored, this is a strong signal that the deletion was wrong the first time. Read the restore commit message. Do not repeat the same deletion without user approval.

### Step 5 — Ask the user before deleting
State:
- What the file does
- Why you believe it should be deleted
- What concrete evidence you have (cite it)
- What will break if the deletion is wrong

**NEVER delete silently as part of a larger commit without the steps above.**

---

## 22) Git log reading standard — how to interpret commit history

Git commit messages in this repo may have been written by AI agents. AI-authored commit messages CAN be factually wrong. Apply the following rules when reading git history.

### 22.1) Treat AI commit messages as claims, not facts
- Commit messages starting with "fix:", "refactor:", "chore:" written by an AI agent describe what the AI *believed* it was doing — not necessarily what actually happened or what was correct.
- Example from this repo — the deletion commit (a643864) incorrectly claimed proxy.ts is the Next.js 16 entry point:
  > `a643864 — "fix(build): delete middleware.ts — Next.js 16 proxy.ts is the sole entry point"`
  This was wrong. Next.js only reads middleware.ts. proxy.ts was silently ignored — auth guard never ran.
  The restore (598506d) was actually correct. Session 38 permanently restored middleware.ts and deleted proxy.ts.
  Lesson: verify the actual framework behaviour before accepting an AI commit's framework claims as truth.

### 22.2) Verify framework behaviour claims in commit messages
If a commit message makes a claim about how a framework works (e.g. "Next.js 16 does X"), do not accept it as true. Verify against:
- Official Next.js / next-intl / Supabase docs
- The actual source code
If you cannot verify, treat the claim as unverified and do not base new actions on it.

### 22.3) A commit that "fixes" something may have introduced a regression
If you see a commit that fixed a perceived problem by deleting or removing something, check:
1. Was the "problem" ever confirmed with a real error?
2. Is there a subsequent commit that restored what was deleted?
3. Does the MEMORY.md or agents.md mention this as a known bad pattern?

### 22.4) Reading a git log — what each field means
```
<hash>  <type>(<scope>): <description>
         └── AI-authored? Check Co-Authored-By trailer.
             If yes, apply scepticism to framework claims.
```

**Co-Authored-By: Claude** in the commit trailer = AI wrote or heavily influenced this commit.
This does NOT mean the commit is wrong — but it means framework behaviour claims need independent verification.

### 22.5) Restoration pattern — investigate before acting
If `git log --all -- <file>` shows: `delete → restore → delete → restore`
**Do not assume the deletion was wrong.** The cycle may mean both sides were wrong at different times.
Before restoring a deleted file:
1. Read the delete commit message AND the restore commit message
2. Reproduce the actual error that each commit claimed to fix
3. Check the Vercel / CI build logs for the real error, not just commit messages

Known cycle in this repo:
- `marketplace/middleware.ts`: deleted (9f73b6c), restored (ab60954), deleted (6a4af6b), restored (598506d), deleted (a643864), **restored (session 38 — final correct state)**
- **Corrected conclusion**: `middleware.ts` MUST exist. `proxy.ts` was a false belief — Next.js never read it as middleware. The "broke build" claim in commit a643864 was wrong: the build error was caused by both files coexisting, not by middleware.ts existing. The fix was to delete proxy.ts and keep middleware.ts, not the other way around. proxy.ts has been permanently deleted in session 38.



