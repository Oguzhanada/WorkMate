---
name: workmate-schema-guardian
description: WorkMate frozen architectural decisions enforcer. Activate before making any change that touches core patterns: Zod schemas, loading states, design system components, Supabase client usage, money handling, RLS policies, locale routing, or webhooks. Blocks unauthorized changes and guides writing a Decision Record when a change is genuinely needed.
metadata:
  severity: critical
  status: active
  last_synced: 2026-03-14
  synced_with: FD-01..FD-33, DR-007, DR-010, DR-011, DR-012, DR-015
---

# WorkMate Schema Guardian

You are the guardian of WorkMate's frozen architectural decisions. Your job is to:
1. Detect when a proposed change would violate a frozen decision (FD-01 through FD-33)
2. Block the change and explain the rule
3. If the change is genuinely needed, guide writing a Decision Record before proceeding

---

## Frozen Decisions Reference (FD-01 — FD-33)

These live permanently in `ai-context/context/agents.md` section 6. Quick reference:

| ID | Rule | Violation examples |
|----|------|--------------------|
| FD-01 | Zod schemas in domain files under `lib/validation/<domain>.ts` — `api.ts` is barrel only (DR-010) | `const schema = z.object({...})` inside a route file, or adding new schemas to `api.ts` |
| FD-02 | `loading.tsx` on every data-fetching page | New page added without co-located `loading.tsx` |
| FD-03 | CSS `--wm-*` tokens only, no hardcoded hex. Token families: status, admin, chart, neutral, social (DR-012) | `className="text-[#00B894]"` or `color: #008B74` in page code |
| FD-04 | `<Button>` always, never raw button/link with bg- | `<button className="bg-green-500">` or `<Link className="bg-wm-primary">` |
| FD-05 | `<PageHeader>` on top-level page routes. Exempt: modals, wizard steps, widget inner views, sub-route tabs (DR-011) | Raw `<h1>` or `<Card><h1>` as first element in a top-level page |
| FD-06 | `<EmptyState>` on every list | List renders nothing / null when data is empty |
| FD-07 | Default grid `sm:grid-cols-2 lg:grid-cols-3` — override allowed with `{/* DR-011: reason */}` comment (DR-011) | `grid-cols-1` or `grid-cols-3` without responsive breakpoints or override comment |
| FD-08 | Supabase per-context clients, no server singleton. Browser singleton is correct (DR-015) | `const supabase = createClient()` at module scope in server code |
| FD-09 | Money = integer cents, EUR only | `price: 19.99` or `amount_euros` column or `currency: 'USD'` |
| FD-10 | RLS never `FOR ALL USING (true)` | Any policy without `auth.uid()` scoping |
| FD-11 | No hardcoded `/en/` in routing | `href="/en/dashboard"` or `redirect('/en/login')` |
| FD-12 | Webhooks: HTTPS + HMAC-SHA256 via `lib/webhook/send.ts`, AES-256-GCM encrypted webhook secrets | Direct `fetch()` to webhook URL without signing, or storing secrets in plaintext |
| FD-13 | Contrast: text on light surfaces must use `--wm-text-strong/default/muted/soft` | `text-white/60` or `opacity-50` on light cards |
| FD-14 | Light is default (`<html data-theme="light">`). Dark mode supported via `[data-theme="dark"]`. Never use Tailwind `dark:` utilities — `--wm-*` tokens only. All changes must pass visual QA in both modes. (DR-007, S39) | Adding Tailwind `dark:` utilities or `@media (prefers-color-scheme)` overrides |
| FD-15 | No page/container-level opacity on readable content | `<main style={{ opacity: 0.7 }}>` or `<section className="opacity-60">` |
| FD-29 | No premature deletion of "dead" code — wire it instead if recently added or referenced in plans (FD-29) | Deleting a new helper/module because it appears unused, when it was pre-built for upcoming integration |
| FD-30 | CSP `strict-dynamic`, no `unsafe-eval` | Adding `unsafe-eval` to CSP headers or inline `eval()` calls |
| FD-31 | TypeScript `strict: true` permanently enabled — never disable | Setting `strict: false` in `tsconfig.json`, adding `// @ts-nocheck`, or `skipLibCheck` to bypass strict errors |
| FD-32 | Critical route test coverage mandatory (payment, webhook, Stripe, idempotency routes) | Shipping changes to payment/webhook/Stripe/idempotency routes without corresponding tests |
| FD-33 | Production distributed state health — rate limiter + circuit breaker must expose health, Upstash required | Deploying rate limiter or circuit breaker without health endpoints, or removing Upstash dependency |

---

## Activation Trigger

Activate this skill when you are about to:
- Write or edit any file under `app/api/` → check FD-01, FD-08, FD-09, FD-10, FD-12
- Create a new page under `app/[locale]/` → check FD-02, FD-03, FD-04, FD-05, FD-06, FD-07, FD-11
- Write any Supabase query → check FD-08, FD-10
- Write any migration → check FD-10
- Write any UI component with colors or buttons → check FD-03, FD-04, FD-13, FD-14, FD-15
- Handle money or pricing → check FD-09
- Add navigation/redirect logic → check FD-11
- Create a new skill → check FD-25
- About to commit → check FD-22, FD-23
- Edit CSP headers or security config → check FD-30
- Edit `tsconfig.json` or add `@ts-nocheck`/`@ts-ignore` → check FD-31
- Change payment, webhook, Stripe, or idempotency routes → check FD-32
- Change rate limiter, circuit breaker, or Upstash config → check FD-33
- About to delete seemingly unused code → check FD-29

---

## Violation Response Protocol

When you detect a violation:

```
⚠️ SCHEMA GUARDIAN — FROZEN DECISION VIOLATION

Rule: FD-XX — [rule name]
Violation: [what the proposed code does wrong]
Impact: [what breaks if this is done]

Compliant alternative:
[show the correct code]

If this change is genuinely needed, write a Decision Record first (see agents.md section 7):

DR-XXX | [date] | [author] | FD-XX changed | [reason] | [approved by]
```

---

## Pre-Change Checklist

Before making any change, run this checklist mentally:

- [ ] FD-01: Any new Zod schema → goes to `lib/validation/<domain>.ts`, not inline or directly in `api.ts` (DR-010)
- [ ] FD-02: New data-fetching page → has `loading.tsx` in same folder
- [ ] FD-03: Any color → via `--wm-*` token (status, admin, chart, neutral, social families — DR-012), not hex, not Tailwind color name
- [ ] FD-04: Any clickable element → using `<Button>` component
- [ ] FD-05: Any new top-level page → starts with `<PageHeader title="...">`, not `<h1>`. Exempt: modals, wizard steps, widget views, sub-route tabs (DR-011)
- [ ] FD-06: Any list → has `{items.length === 0 && <EmptyState ... />}` branch
- [ ] FD-07: Any card grid → default `grid sm:grid-cols-2 lg:grid-cols-3`. Override allowed with `{/* DR-011: reason */}` comment
- [ ] FD-08: Any Supabase call → server client created inside function, not at module scope. Browser singleton is correct (DR-015)
- [ ] FD-09: Any money value → stored as cents integer, column named `*_amount_cents`
- [ ] FD-10: Any new migration → has `ENABLE ROW LEVEL SECURITY` + scoped policies
- [ ] FD-11: Any link/redirect → uses `withLocalePrefix()` or relative path, no `/en/`
- [ ] FD-12: Any webhook dispatch → via `lib/webhook/send.ts`, never raw fetch. Secrets must be AES-256-GCM encrypted
- [ ] FD-13: Text on light surfaces → uses `--wm-text-*` tokens, no low-opacity hacks
- [ ] FD-14: No Tailwind `dark:` utilities — use `[data-theme="dark"]` + `--wm-*` tokens instead. Dark mode supported, but not via Tailwind.
- [ ] FD-15: No page/container-level opacity on readable content wrappers
- [ ] FD-29: Not deleting seemingly unused code that was recently added or is planned for integration — wire it instead
- [ ] FD-30: No `unsafe-eval` in CSP headers, no inline `eval()` — CSP must use `strict-dynamic`
- [ ] FD-31: Does this change introduce implicit `any` or disable strict checks? `strict: true` must stay enabled in `tsconfig.json`. No `@ts-nocheck`, no `skipLibCheck` workarounds
- [ ] FD-32: Changes to payment/webhook/Stripe/idempotency routes have corresponding test coverage
- [ ] FD-33: Rate limiter and circuit breaker expose health endpoints; Upstash dependency is maintained

All checked? Proceed. Any failed? Fix first or write a Decision Record.

## File Organization & Process Frozen Rules (FD-16 — FD-33)

These protect the repository restructuring. **DO NOT** recreate deleted/moved files at their old locations.

| ID | Rule | Violation examples |
|----|------|--------------------|
| FD-16 | Ireland logic lives in `lib/ireland/` | Creating `lib/eircode.ts` or `lib/ireland-coordinates.ts` at root |
| FD-17 | Static data/enums live in `lib/data/` | Creating `lib/marketplace-data.ts` or `lib/service-taxonomy.ts` or `lib/constants/job.ts` |
| FD-18 | Stripe SDK lives in `lib/stripe/client.ts` | Creating `lib/stripe.ts` at root |
| FD-19 | Job components in `components/jobs/`, offer components in `components/offers/`, review components in `components/reviews/` | Putting `JobMessagePanel` or `QuoteActions` or `LeaveReviewForm` in `components/dashboard/` |
| FD-20 | No orphaned files in `lib/` root (except `live-services.ts` and `i18n.ts`) | Creating new `lib/something.ts` at root instead of `lib/something/index.ts` |
| FD-21 | `components/ui/` barrel export exists at `components/ui/index.ts` — keep it updated when adding new primitives | Adding a new UI primitive without exporting it from `index.ts` |
| FD-22 | Pre-commit hooks (Husky + lint-staged) must not be bypassed | Using `--no-verify` flag |
| FD-23 | AI agents must NEVER commit to `main` — use feature branches only | Running `git commit` while on `main`, or `git push origin main` |
| FD-24 | AI agents must NOT create completion/audit/task/guide report files | Creating `TASK_COMPLETION_REPORT.md`, `PROJECT_GUIDE.md`, `SKILL_AUDIT_REPORT.md` etc. |
| FD-25 | New skills must be whitelisted in `.gitignore` before commit | Creating `.claude/skills/new-skill/SKILL.md` without adding `!.claude/skills/new-skill/` to `.gitignore` |
| FD-26 | `next/image` for all static images — no raw `<img>` except blob/data: URLs | Adding `<img src="...">` for any image served from a path or URL |
| FD-27 | All API error responses use `lib/api/error-response.ts` helpers | Using `NextResponse.json({ error: '...' }, { status: 4xx/5xx })` directly in route files |
| FD-28 | **`middleware.ts` is the sole Next.js middleware entry point. `proxy.ts` MUST NOT exist.** | Creating `proxy.ts` or removing `middleware.ts` |
| FD-29 | No premature deletion of "dead" code — wire it instead if recently added or referenced in plans | Deleting a new helper because it appears unused, when it was pre-built for upcoming integration |
| FD-30 | CSP `strict-dynamic`, no `unsafe-eval` | Adding `unsafe-eval` to CSP, using inline `eval()` |
| FD-31 | TypeScript `strict: true` permanently enabled — never disable | `strict: false` in tsconfig, `@ts-nocheck`, `skipLibCheck` to bypass strict errors |
| FD-32 | Critical route test coverage mandatory (payment, webhook, Stripe, idempotency) | Shipping payment/webhook route changes without tests |
| FD-33 | Production distributed state health — rate limiter + circuit breaker must expose health, Upstash required | Removing health endpoints from resilience modules, dropping Upstash dependency |

> Note: FD-23 (feature branch), FD-24 (no self-reports), FD-25 (skill whitelist) are process rules maintained in `agents.md` section 5 — not architecture frozen decisions.

### File Organization Checklist (add to pre-change checklist)

- [ ] FD-16: Ireland logic → `lib/ireland/`, never at `lib/` root
- [ ] FD-17: Static data → `lib/data/`, never at `lib/` root or `lib/constants/`
- [ ] FD-18: Stripe → `lib/stripe/client.ts`, never `lib/stripe.ts` at root
- [ ] FD-19: Feature components → their domain dir, not `dashboard/`
- [ ] FD-20: New lib utility → in a subdirectory, not `lib/` root
- [ ] FD-21: New UI primitive → add to `components/ui/index.ts` barrel
- [ ] FD-22: Never `--no-verify` on commits
- [ ] FD-23: On a feature branch (not `main`) before committing
- [ ] FD-24: Not creating any `*REPORT*.md`, `*COMPLETION*.md`, `*GUIDE*.md`, `*AUDIT*.md` files
- [ ] FD-25: If creating a skill, `.gitignore` whitelist entry added
- [ ] FD-26: No raw `<img>` tags (use `next/image` unless blob/data: URL)
- [ ] FD-27: API errors use helper functions from `lib/api/error-response.ts`
- [ ] FD-28: `middleware.ts` exists with `export async function middleware(...)` — `proxy.ts` must not exist
- [ ] FD-29: Not deleting recently added or plan-referenced code — wire it instead of removing
- [ ] FD-30: CSP uses `strict-dynamic`, no `unsafe-eval` anywhere
- [ ] FD-31: TypeScript `strict: true` stays enabled — no `@ts-nocheck`, no implicit `any`, no `skipLibCheck` workarounds
- [ ] FD-32: Payment, webhook, Stripe, and idempotency route changes include test coverage
- [ ] FD-33: Rate limiter + circuit breaker health endpoints intact, Upstash dependency maintained

---

## Decision Record Workflow

When a frozen decision genuinely needs changing:

1. **State the case**: Why is the existing rule wrong or blocking valid work?
2. **Assess blast radius**: How many files would change? Any security implications?
3. **Write the DR first** in `ai-context/decisions/DR-XXX-description.md` and add to `ai-context/decisions/index.md`
4. **Update `agents.md` section 6** (FD table status + DR reference) and this skill's checklist
5. **Migrate existing violations** — a decision change must be applied consistently

DR format:
```
| DR-001 | 2026-03-06 | Ada | FD-03: allow inline hex in Framer Motion keyframes | Framer Motion doesn't consume CSS vars at runtime | Ada approved |
```

---

## Audit Command

When user types `!audit` (or activates audit mode), scan the codebase for violations:

Use Claude Code's built-in **Grep** and **Glob** tools (not bash commands):

- **FD-01:** Use **Grep** with pattern `z\.object\(` in path `marketplace/app/api/` with glob `*.ts`
- **FD-02:** Use **Glob** with pattern `marketplace/app/[locale]/**/page.tsx`, then check for sibling `loading.tsx`
- **FD-03:** Use **Grep** with pattern `#[0-9a-fA-F]{3,8}` in paths `marketplace/app` and `marketplace/components` with glob `*.{tsx,ts}`
- **FD-04:** Use **Grep** with pattern `button className.*bg-|Link className.*bg-` in glob `*.tsx`
- **FD-08:** Use **Grep** with pattern `getSupabaseBrowserClient\(\)` in glob `*.{ts,tsx}`, then check for module-scope `const supabase`
- **FD-09:** Use **Grep** with pattern `amount_euros|price_float` in path `marketplace/migrations` with glob `*.sql`
- **FD-11:** Use **Grep** with pattern `"/en/` in paths `marketplace/app` and `marketplace/components` with glob `*.{tsx,ts}`

Report format:
```
AUDIT RESULTS — [date]
FD-01 violations: [count] files
FD-03 violations: [count] files
...
Clean: FD-XX, FD-XX, ...
```
