---
VERSION: 1.0
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Initial architecture outline created
- Mapped route, component, and library domains
---

# Architecture

## Repository Layout

- Root context/docs at repository root (`PROJECT_CONTEXT.md`, `docs/`).
- Main product application in `marketplace/`.

## Core App Structure (`marketplace/`)

- `app/`: App Router pages and route handlers.
  - `app/[locale]/...`: localized page tree.
  - `app/api/...`: server route handlers (jobs, quotes, admin, disputes, payments).
- `components/`: UI modules by domain.
  - `auth`, `dashboard`, `forms`, `home`, `payments`, `profile`, `site`, `ui`.
- `lib/`: shared business and integration logic.
  - `auth`, `supabase`, `validation`, `pricing`, `ranking`, `hooks`, `notifications`.
- `migrations/`: ordered SQL schema evolution (`001` to `036`).
- `supabase/functions/`: Edge Functions (`match-task-alerts`, retention, dispute/payment automations).
- `tests/`: `unit`, `integration`, `e2e/smoke`, and setup helpers.

## Notable System Patterns

- API-first domain actions in route handlers with Zod validation.
- Role-based gating via `user_roles` + profile fallback logic.
- Locale-safe navigation helpers (`lib/i18n/locale-path.ts`).
- Admin dashboard uses live API-backed review workflows and audit logging.

