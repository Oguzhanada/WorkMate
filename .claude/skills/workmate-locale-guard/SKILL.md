---
name: workmate-locale-guard
description: Activate when changing navigation, auth redirects, dashboard links, or locale-aware route structure in the Next.js + next-intl app.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# Locale Route Guard

## Where to Look

- Canonical locale helper: read `marketplace/lib/i18n/locale-path.ts` for route utilities.

## Key Functions (lib/i18n/locale-path.ts)

- `getLocaleRoot(pathname)` — extracts `/en` prefix from current path
- `withLocalePrefix(localeRoot, '/target')` — builds locale-prefixed URL

```tsx
// FORBIDDEN (FD-11):
redirect('/en/dashboard/customer');

// CORRECT:
const localeRoot = getLocaleRoot(pathname);
router.push(withLocalePrefix(localeRoot, '/dashboard/customer'));
```

## Quick Audit

Grep `"/en/` in `marketplace/app/` and `marketplace/components/` — all matches are FD-11 violations.

## Workflow

1. Scan for hardcoded route patterns missing locale prefixes.
2. Confirm locale-aware helpers are used in both client and server contexts.
3. Patch non-localized dashboard/profile redirects.
4. Validate localized navigation behavior.

## Resources

- `references/locale-route-rules.md`
- `scripts/check_locale_routes.ps1`

## Shared Rules

Follow `.claude/skills/references/workmate-shared-guardrails.md`.

## NEVER DO

- Never use hardcoded `/en/` or `/dashboard/` paths; always use locale helpers.
- Never bypass next-intl middleware for redirect shortcuts.
