---
name: workmate-schema-guardian
description: Activate before any change touching core patterns — Zod schemas, loading states, design system, Supabase clients, money handling, RLS, locale routing, webhooks, CSP, or TypeScript config. Blocks violations and guides Decision Records.
metadata:
  severity: critical
  status: active
  synced_with: agents.md section 6
---

# WorkMate Schema Guardian

Frozen Decisions FD-01..FD-33 are defined in ai-context/context/agents.md section 6. Read that file for the canonical reference. This skill enforces compliance.

## Activation Trigger

Activate when about to:
- Edit `app/api/` files — check FD-01, FD-08, FD-09, FD-10, FD-12
- Create page under `app/[locale]/` — check FD-02..FD-07, FD-11
- Write Supabase query or migration — check FD-08, FD-10
- Write UI with colors/buttons — check FD-03, FD-04, FD-13..FD-15
- Handle money/pricing — FD-09 | Navigation/redirects — FD-11
- Edit CSP/security config — FD-30 | Edit tsconfig or add `@ts-nocheck` — FD-31
- Change payment/webhook/Stripe/idempotency routes — FD-32
- Change rate limiter/circuit breaker/Upstash — FD-33
- Delete unused code — FD-29 | Create skill — FD-25 | Commit — FD-22, FD-23

NEVER DO:
- NEVER approve a change without checking applicable FDs first
- NEVER skip the activation trigger — if the change matches any category above, run the check
- NEVER allow a frozen decision override without a written Decision Record

## Pre-Change Checklist

Read ai-context/context/agents.md section 6 and verify each applicable FD before committing.
## Violation Response Protocol

When a violation is detected:

```
SCHEMA GUARDIAN — FROZEN DECISION VIOLATION

Rule: FD-XX — [rule name]
Violation: [what the proposed code does wrong]
Impact: [what breaks if this is done]

Compliant alternative:
[show the correct code]

If this change is genuinely needed, write a Decision Record first (see agents.md section 7):
DR-XXX | [date] | [author] | FD-XX changed | [reason] | [approved by]
```

NEVER DO:
- NEVER allow the violation to proceed without showing the compliant alternative
- NEVER skip the impact assessment
- NEVER approve an override verbally — require a written DR

## Decision Record Workflow

When a frozen decision genuinely needs changing:

1. State the case — why is the rule wrong or blocking valid work?
2. Assess blast radius — file count and security implications
3. Write DR in `ai-context/decisions/DR-XXX-description.md`, add to `ai-context/decisions/index.md`
4. Update `agents.md` section 6 (FD table + DR reference)
5. Migrate existing violations consistently

## Audit Command (`!audit`)

Scan codebase using Grep and Glob tools for key violations:

- **FD-01:** Grep `z\.object\(` in `marketplace/app/api/` glob `*.ts`
- **FD-02:** Glob `marketplace/app/[locale]/**/page.tsx`, check sibling `loading.tsx`
- **FD-03:** Grep `#[0-9a-fA-F]{3,8}` in `marketplace/app` and `marketplace/components`
- **FD-04:** Grep `button className.*bg-|Link className.*bg-` glob `*.tsx`
- **FD-08:** Grep module-scope `const supabase` in server files
- **FD-09:** Grep `amount_euros|price_float` in `marketplace/migrations`
- **FD-11:** Grep `"/en/` in `marketplace/app` and `marketplace/components`

Report: list violation counts per FD, then list clean FDs.
