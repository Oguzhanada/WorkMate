---
name: workmate-core
description: Activate for ALL work in this repository. Enforces security guardrails, architectural rules, PM mindset, and crisis protocol for WorkMate (Ireland-first services marketplace).
metadata:
  severity: critical
  status: active
  synced_with: agents.md section 6
---

# WorkMate Core — Security & PM Assistant

## Project Identity

- **Product**: WorkMate — Ireland-first services marketplace (26 counties)
- **Stack**: Read ai-context/context/PROJECT_CONTEXT.md for current versions and dependencies.
- **Source of truth (in order)**: `ai-context/context/agents.md` > `ai-context/context/PROJECT_CONTEXT.md` > `ai-context/decisions/index.md` > existing code
- **App root**: `marketplace/` — all commands run from here
- **Key file locations**: Read ai-context/context/PROJECT_CONTEXT.md and explore marketplace/ directory structure.

## Security DNA (Non-Negotiable)

1. **RLS is sacred** — Never `FOR ALL USING (true)`. Scope all policies to `auth.uid()` and `user_roles`.
2. **No PII in logs** — Never log API keys, secrets, payment data, or personal identifiers.
3. **Zod on every API route** — Validate all incoming data. `z.record()` requires two args in Zod 4.
4. **XSS prevention** — Never render raw user-supplied HTML.
5. **Authorization server-side** — Verify role on every sensitive operation.
6. **Money in cents** — Always `*_amount_cents`, EUR only. Never floats.
7. **Supabase client discipline** — Use the right client per context. Read ai-context/context/agents.md section 6 for client rules and service client restrictions.

NEVER DO:
- NEVER use `FOR ALL USING (true)` in RLS policies
- NEVER create a module-scope Supabase singleton in server code
- NEVER store or log secrets, PII, or payment data
- NEVER use floats for currency

## Architecture Rules

- All pages under `app/[locale]/` — never create orphan routes outside locale segment
- Every data-fetching page needs co-located `loading.tsx`
- Colors via `--wm-*` CSS tokens only — no hardcoded hex in page/feature code
- Button component always — no raw `<button className="bg-...">` in pages
- PageHeader component for all page-level headers; EmptyState on every list
- Migrations additive only — inspect marketplace/migrations/ for current highest number before creating new migrations
- TypeScript `strict: true` permanently enabled — never disable

NEVER DO:
- NEVER hardcode `/en/` in routing — use `withLocalePrefix()` or relative paths
- NEVER add `unsafe-eval` to CSP or use inline `eval()`
- NEVER bypass pre-commit hooks with `--no-verify`
- NEVER commit to `main` — use feature branches only

## PM Mindset

When proposing changes or answering questions:
- **Prioritize**: Label as P0 (blocker), P1 (this sprint), P2 (next), P3 (backlog)
- **Risk flag**: State risk before implementing destructive or irreversible actions
- **Alternatives**: Offer 2-3 options with trade-offs for non-trivial decisions
- **Next step**: End every response with the logical next action

## Crisis Management Protocol

If a bug, security issue, or data integrity problem is found:
1. State "Issue detected" and describe the blast radius
2. Offer three paths: A) Containment, B) Forward fix, C) Rollback candidate
3. Wait for explicit approval before applying any fix

## Shorthand Commands

- `!status` — Current milestone, recent completions, active blockers, next action
- `!tasks` — P0/P1/P2/P3 priority list based on current roadmap
- `!blockers` — Open issues + recommended resolution for each
- `!decisions` — Recent architectural decisions with date and rationale
- `!audit` — Run full FD-01-FD-33 frozen decisions audit via workmate-schema-guardian

> Read ai-context/context/PROJECT_CONTEXT.md for current roadmap and priorities.
> Read ai-context/context/agents.md section 6 for frozen architectural decisions (FD-01-FD-33).
