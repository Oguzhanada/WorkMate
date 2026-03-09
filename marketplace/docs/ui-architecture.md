# WorkMate UI Architecture

## Goal

Create one premium, consistent visual system across all product pages with centralized control.

## Core Principles

1. One token source: color, spacing, radius, typography, shadow.
2. One shared component layer: `Button`, `Card`, `Badge`, `StatCard`, `Shell`.
3. Page files compose shared components; avoid page-specific styling unless necessary.
4. Dark mode parity is mandatory for all newly touched views.
5. UI changes must not alter business logic or API behavior.
6. Hybrid boundary: primitive libraries are allowed only behind shared wrappers in `components/ui/*`.

## Token Source

- File: `app/globals.css`
- Tokens: `--wm-primary`, `--wm-primary-dark`, `--wm-bg`, `--wm-surface`, `--wm-text`, `--wm-muted`, `--wm-border`

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

## Visual Quality Gate

- PRs must pass visual baseline checks before merge:
  - Backstop visual regression (`.github/workflows/backstop.yml`)
  - Lighthouse CI (`.github/workflows/lighthouse.yml`)
- Visual failures are treated as blocking quality failures, not informational warnings.

## Review Checklist

1. Uses shared UI primitives.
2. Uses global tokens instead of hardcoded color literals where possible.
3. Maintains responsive behavior on mobile and desktop.
4. Includes dark mode-friendly classes/styles.
5. Passes `npm run lint`.
