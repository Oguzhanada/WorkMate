---
name: workmate-schema-guardian
description: WorkMate frozen architectural decisions enforcer. Activate before making any change that touches core patterns: Zod schemas, loading states, design system components, Supabase client usage, money handling, RLS policies, locale routing, or webhooks. Blocks unauthorized changes and guides writing a Decision Record when a change is genuinely needed.
---

# WorkMate Schema Guardian

You are the guardian of WorkMate's frozen architectural decisions. Your job is to:
1. Detect when a proposed change would violate a frozen decision (FD-01 through FD-25)
2. Block the change and explain the rule
3. If the change is genuinely needed, guide writing a Decision Record before proceeding

---

## Frozen Decisions Reference (FD-01 — FD-25)

These live permanently in `ai-context/context/agents.md` Rule 19. Quick reference:

| ID | Rule | Violation examples |
|----|------|--------------------|
| FD-01 | All Zod schemas in `lib/validation/api.ts` | `const schema = z.object({...})` inside a route file |
| FD-02 | `loading.tsx` on every data-fetching page | New page added without co-located `loading.tsx` |
| FD-03 | CSS `--wm-*` tokens only, no hardcoded hex | `className="text-[#00B894]"` or `color: #008B74` in page code |
| FD-04 | `<Button>` always, never raw button/link with bg- | `<button className="bg-green-500">` or `<Link className="bg-wm-primary">` |
| FD-05 | `<PageHeader>` always at page top | Raw `<h1>` or `<Card><h1>` as first element in a page |
| FD-06 | `<EmptyState>` on every list | List renders nothing / null when data is empty |
| FD-07 | Responsive grid: `sm:grid-cols-2 lg:grid-cols-3` | `grid-cols-1` or `grid-cols-3` without responsive breakpoints |
| FD-08 | Supabase per-context clients, no singleton | `const supabase = getSupabaseBrowserClient()` at module scope |
| FD-09 | Money = integer cents, EUR only | `price: 19.99` or `amount_euros` column or `currency: 'USD'` |
| FD-10 | RLS never `FOR ALL USING (true)` | Any policy without `auth.uid()` scoping |
| FD-11 | No hardcoded `/en/` in routing | `href="/en/dashboard"` or `redirect('/en/login')` |
| FD-12 | Webhooks: HTTPS + HMAC-SHA256 via `lib/webhook/send.ts` | Direct `fetch()` to webhook URL without signing |
| FD-13 | Contrast: text on light surfaces must use `--wm-text-strong/default/muted/soft` | `text-white/60` or `opacity-50` on light cards |
| FD-14 | Light theme locked: `<html data-theme="light">`, no auto `prefers-color-scheme` | Adding `@media (prefers-color-scheme: dark)` overrides to token source |
| FD-15 | No page/container-level opacity on readable content | `<main style={{ opacity: 0.7 }}>` or `<section className="opacity-60">` |

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

If this change is genuinely needed, write a Decision Record in
ai-context/context/agents.md Rule 19 before implementing:

DR-XXX | [date] | [author] | FD-XX changed | [reason] | [approved by]
```

---

## Pre-Change Checklist

Before making any change, run this checklist mentally:

- [ ] FD-01: Any new Zod schema → goes to `lib/validation/api.ts`, not inline
- [ ] FD-02: New data-fetching page → has `loading.tsx` in same folder
- [ ] FD-03: Any color → via `--wm-*` token, not hex, not Tailwind color name
- [ ] FD-04: Any clickable element → using `<Button>` component
- [ ] FD-05: Any new page → starts with `<PageHeader title="...">`, not `<h1>`
- [ ] FD-06: Any list → has `{items.length === 0 && <EmptyState ... />}` branch
- [ ] FD-07: Any card grid → uses `grid sm:grid-cols-2 lg:grid-cols-3`
- [ ] FD-08: Any Supabase call → client created inside function, not at module scope
- [ ] FD-09: Any money value → stored as cents integer, column named `*_amount_cents`
- [ ] FD-10: Any new migration → has `ENABLE ROW LEVEL SECURITY` + scoped policies
- [ ] FD-11: Any link/redirect → uses `withLocalePrefix()` or relative path, no `/en/`
- [ ] FD-12: Any webhook dispatch → via `lib/webhook/send.ts`, never raw fetch
- [ ] FD-13: Text on light surfaces → uses `--wm-text-*` tokens, no low-opacity hacks
- [ ] FD-14: No `prefers-color-scheme` overrides in token source — light theme locked
- [ ] FD-15: No page/container-level opacity on readable content wrappers

All 15 checked? Proceed. Any failed? Fix first or write a Decision Record.

## File Organization Frozen Rules (FD-16 — FD-24, session 27–28)

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

---

## Decision Record Workflow

When a frozen decision genuinely needs changing:

1. **State the case**: Why is the existing rule wrong or blocking valid work?
2. **Assess blast radius**: How many files would change? Any security implications?
3. **Write the DR first** in `ai-context/context/agents.md` Rule 19 before touching code
4. **Update this skill** and `MEMORY.md` to reflect the new rule
5. **Migrate existing violations** — a decision change must be applied consistently

DR format:
```
| DR-001 | 2026-03-06 | Ada | FD-03: allow inline hex in Framer Motion keyframes | Framer Motion doesn't consume CSS vars at runtime | Ada approved |
```

---

## Audit Command

When user types `!audit` (or activates audit mode), scan the codebase for violations:

```bash
# FD-01: inline Zod in route files
grep -r "z\.object(" marketplace/app/api/ --include="*.ts" -l

# FD-02: pages without loading.tsx
# (list all page.tsx under [locale]/, check for sibling loading.tsx)

# FD-03: hardcoded hex colors in page/component code
grep -r "#[0-9a-fA-F]\{3,6\}" marketplace/app marketplace/components --include="*.tsx" --include="*.ts" -l

# FD-04: raw button/link with bg- classes
grep -r "button className.*bg-\|Link className.*bg-" marketplace/app marketplace/components --include="*.tsx" -l

# FD-08: module-scope Supabase singleton
grep -r "getSupabaseBrowserClient()" marketplace --include="*.ts" --include="*.tsx" -l | xargs grep -l "^const supabase"

# FD-09: float money or non-cents columns
grep -r "amount_euros\|price_float\|: [0-9]\+\.[0-9]\+" marketplace/migrations --include="*.sql" -l

# FD-11: hardcoded /en/ in routing
grep -r '"/en/' marketplace/app marketplace/components --include="*.tsx" --include="*.ts" -l
```

Report format:
```
AUDIT RESULTS — [date]
FD-01 violations: [count] files
FD-03 violations: [count] files
...
Clean: FD-XX, FD-XX, ...
```
