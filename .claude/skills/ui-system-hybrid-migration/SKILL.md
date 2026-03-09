---
name: ui-system-hybrid-migration
description: Hybrid UI migration workflow for WorkMate. Use when introducing or migrating shared UI primitives, creating wrapper-based components in components/ui, updating token mappings, or enforcing the boundary that Shadcn/Radix primitives are allowed in wrappers but not scattered across page-level code.
---

# UI System Hybrid Migration

## Workflow

1. Confirm decision context:
- Read `ai-context/decisions/DR-002-hybrid-ui-strategy.md`.
- Keep wrapper API stable for page consumers.

2. Apply wrapper boundary:
- Add or update primitives in `components/ui/*`.
- If using Shadcn/Radix, keep usage internal to wrappers.
- Do not leak primitive-specific patterns directly into page files.

3. Enforce token mapping:
- Map color, spacing, radius, shadow, and transitions to `--wm-*` tokens.
- Remove duplicated page-level visual styles and move repeatable patterns to wrappers.

4. Protect behavior:
- Preserve public props/signatures of existing wrappers unless explicitly approved.
- Avoid business-logic changes while performing UI migration.

5. Validate:
- `npm run lint`
- `npm run test`
- Run visual gate checks through PR workflows (Backstop + Lighthouse).

## Checklist

- Wrapper API compatibility confirmed.
- Token mapping applied for all changed primitives.
- No new random utility-heavy style systems in page files.
- Visual regressions reviewed and fixed before merge.
