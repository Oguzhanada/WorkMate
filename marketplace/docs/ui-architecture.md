# WorkMate UI Architecture

## Goal

Create one premium, consistent visual system across all product pages with centralized control.
Flow roadmap reference: `marketplace/docs/flow-maturity-roadmap-10w.md`

## Core Principles

1. One token source: color, spacing, radius, typography, shadow.
2. One shared component layer: `Button`, `Card`, `Badge`, `StatCard`, `Shell`.
3. Page files compose shared components; avoid page-specific styling unless necessary.
4. Readability-first contrast is mandatory for all newly touched views.
5. UI changes must not alter business logic or API behavior.
6. Hybrid boundary: primitive libraries are allowed only behind shared wrappers in `components/ui/*`.

## Token Source

- Files: `app/tokens.css` (source of truth), `app/globals.css` (runtime/global layer)
- Tokens: `--wm-primary`, `--wm-primary-dark`, `--wm-bg`, `--wm-surface`, `--wm-text`, `--wm-muted`, `--wm-border`
- Semantic text tokens: `--wm-text-strong`, `--wm-text-default`, `--wm-text-muted`, `--wm-text-soft`

## Contrast Contract

- Theme mode is explicit-only through `<html data-theme="...">`; do not rely on automatic `prefers-color-scheme` token switching.
- Never apply wrapper/container opacity to readable content regions (hero, cards, sections, main content).

- Use semantic text tokens instead of ad-hoc opacity classes for body/supporting copy.
- On light backgrounds:
  - Heading: `--wm-text-strong`
  - Body: `--wm-text-default` or `--wm-text-muted`
  - Helper/meta: `--wm-text-soft`
- Do not use low-opacity foreground colors on light surfaces (`text-white/..`, `opacity-..`).
- If a section uses a dark background, text contrast must remain clearly readable at normal brightness and 125% zoom.

## Shared UI Layer

- `components/ui/Button.tsx`
- `components/ui/Card.tsx`
- `components/ui/Badge.tsx`
- `components/ui/StatCard.tsx`
- `components/ui/Shell.tsx`

### Hybrid Primitive Rule

- Shadcn/Radix primitives may be used **inside** shared wrappers under `components/ui/*`.
- Page files must consume wrapper components and avoid random utility-heavy one-offs.
- Wrapper visuals still map to `--wm-*` tokens in `app/globals.css`.

## Migration Order

1. Dashboards (`customer`, `pro`, `admin`)
2. Auth pages (`login`, `sign-up`, password flows)
3. Profile pages
4. Providers and post-job flows
5. Remaining marketing/support pages

## Engineering Rule

`No new raw CSS`:
- Do not add new page-specific CSS modules for visual styling if shared tokens/components can express the change.
- If a new style primitive is needed, add it once in shared UI/tokens and reuse.
- Avoid style duplication in page files. If a visual pattern appears twice, move it into shared UI layer.

## Flow Readability Rule

- Any stateful step UI (post job, quote compare, accept, dispute, release) must answer:
  - current state
  - next action
  - fallback path
- "What do I do next?" ambiguity is treated as a UX bug, not optional polish.

## Visual Quality Gate

- PRs must pass visual baseline checks before merge:
  - Lighthouse CI (`.github/workflows/lighthouse.yml`)
- Visual failures are treated as blocking quality failures, not informational warnings.

## Review Checklist

1. Uses shared UI primitives.
2. Uses global tokens instead of hardcoded color literals where possible.
3. Maintains responsive behavior on mobile and desktop.
4. Meets the Contrast Contract (headings/body/meta readable on all section backgrounds).
5. Passes `npm run lint`.

