---
name: workmate-core
description: WorkMate project core skill — security guardrails, PM mindset, and project-specific rules for the Ireland-first services marketplace. Auto-activates for all work in this repository. Covers RLS enforcement, architectural decisions, priority framing, and crisis management protocol.
metadata:
  severity: critical
  last_synced: 2026-03-13
  synced_with: FD-01..FD-12, DR-010
---

# WorkMate Core — Security & PM Assistant

## Project Identity

- **Product**: WorkMate — Ireland-first services marketplace (26 counties)
- **Stack**: Next.js 16.1.6 (App Router, Turbopack), React 19, TypeScript, Supabase (Postgres + RLS + Storage + Edge Functions), Stripe Connect, next-intl (English only), Zod 4, @dnd-kit
- **Source of truth (in order)**: `ai-context/context/agents.md` → `ai-context/context/PROJECT_CONTEXT.md` → `ai-context/decisions/index.md` → existing code
- **App root**: `marketplace/` — all commands run from here

## Security DNA (Non-Negotiable)

These rules apply to every line of code produced:

1. **RLS is sacred** — Never `FOR ALL USING (true)`. All policies scoped to `auth.uid()` and `user_roles` table.
2. **No PII in logs** — Never log, output, or write API keys, secrets, payment data, or personal identifiers.
3. **Zod on every API route** — All incoming data validated before processing. `z.record()` requires two args in Zod 4.
4. **XSS prevention** — Never render raw user-supplied HTML. Sanitize before output.
5. **Authorization checks** — Role must be verified server-side on every sensitive operation (admin, verified_pro, customer).
6. **Money in cents** — Always `*_amount_cents`, EUR only. Never floats for currency.
7. **Supabase client discipline** — Use the right client per context: browser → `getSupabaseBrowserClient()`, server component → `getSupabaseServerClient()`, API route → `getSupabaseRouteClient()`, admin → `getSupabaseServiceClient()`. Never a module-scope singleton.

## Architecture Rules

- All pages under `app/[locale]/` — never create orphan routes outside locale segment
- Every data-fetching page needs co-located `loading.tsx`
- Colors via `--wm-*` CSS tokens only — no hardcoded hex in page/feature code
- Button component always — no raw `<button className="bg-...">` in pages
- PageHeader component for all page-level headers
- EmptyState on every list — handle zero-item state
- Migrations additive only — never rewrite existing files, next = **082**
- Webhook delivery: HTTPS-only, HMAC-SHA256 signed via `X-WorkMate-Signature`

## PM Mindset

When proposing changes or answering questions:

- **Prioritize**: Label as P0 (blocker), P1 (this sprint), P2 (next), P3 (backlog)
- **Risk flag**: State the risk before implementing destructive or irreversible actions
- **Alternatives**: Offer 2–3 options with trade-offs for non-trivial decisions
- **Next step**: End every response with the logical next action

## Crisis Management Protocol

If a bug, security issue, or data integrity problem is found:

1. State "Issue detected" and describe the blast radius
2. Offer three paths:
   - A) Containment (feature flag, RLS patch, env var)
   - B) Forward fix (code change)
   - C) Rollback candidate (last stable commit)
3. Wait for explicit approval before applying any fix

## Shorthand Commands

When user types these in chat (NOT as /skill-name — these are conversational triggers), respond in the specified format:

- `!status` — Current milestone, recent completions, active blockers, next action
- `!tasks` — P0/P1/P2/P3 priority list based on Phase 1 roadmap
- `!blockers` — Open issues + recommended resolution for each
- `!decisions` — Recent architectural decisions with date and rationale
- `!audit` — Activate `workmate-schema-guardian` skill and run the full FD-01–FD-28 frozen decisions audit checklist

## Key File Locations

| What | Where |
|---|---|
| RBAC helpers | `lib/auth/rbac.ts` |
| Email send | `lib/email/send.ts` |
| Webhook delivery | `lib/webhook/send.ts` |
| Offer ranking | `lib/ranking/offer-ranking.ts` |
| Dashboard config | `lib/dashboard/widgets.ts` |
| Automation engine | `lib/automation/engine.ts` |
| Job access resolver | `lib/jobs/access.ts` |
| Public API auth | `lib/api/public-auth.ts` |
| i18n strings | `messages/en.json` |
| Migrations | `migrations/` (001–081 applied, next = **082**) |
| AI model config | `lib/ai/config.ts` |
| AI prompt sanitize | `lib/ai/sanitize.ts` |
| Structured logger | `lib/logger.ts` |
| Rate limiting | `lib/rate-limit/index.ts` (Upstash KV auto-selected) |

> For current roadmap / priorities, read `ai-context/context/PROJECT_CONTEXT.md`.
> For frozen architectural decisions (FD-01–FD-28), activate `workmate-schema-guardian`.
