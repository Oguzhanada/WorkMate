# WorkMate Design System

## Scope
This design system applies to all frontend routes under `marketplace/app/[locale]` and shared UI in `marketplace/components`.

## Foundations

### Token Sources
- Primary token file: `app/tokens.css`
- Runtime global styles: `app/globals.css`
- Backward compatibility aliases: `--wm-*` tokens in `app/tokens.css`

### Token Groups
1. Color tokens
- `--color-primary-*`, `--color-neutral-*`
- Semantic: `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- Surfaces/text: `--color-background-*`, `--color-text-*`, `--color-border-*`

2. Typography tokens
- Families: `--font-family-heading`, `--font-family-body`, `--font-family-mono`
- Scale: `--font-size-xs` to `--font-size-4xl`
- Weights/line heights: `--font-weight-*`, `--line-height-*`

3. Spacing tokens
- 8px grid primitives from `--space-0` to `--space-16`

4. Radius/border/shadow tokens
- `--radius-*`, `--border-width-*`, `--shadow-*`

## Atomic Architecture

### Atoms (`components/ui`)
- `Button.tsx`
- `Input.tsx`
- `Label.tsx`
- `Checkbox.tsx`
- `Radio.tsx`
- `Toggle.tsx`
- `Badge.tsx`
- `Tag.tsx`
- `Avatar.tsx`
- `Spinner.tsx`
- `Divider.tsx`

### Molecules
- `FormField.tsx`

### Existing Organisms/Templates
- Navigation/footer/shell/dashboard widgets live under:
  - `components/home`
  - `components/site`
  - `components/dashboard`

## Non-Breakable Readability Guardrails
1. Default theme is locked with `<html data-theme="light">` unless explicitly switched.
2. Token source must not auto-override via `prefers-color-scheme`.
3. Do not use page/container opacity for readable content wrappers.
4. Use semantic text tokens (`--color-text-primary`, `--color-text-secondary`, `--color-text-muted`) for all copy.
## Theme Rules
1. Always use semantic/token values, avoid inline hex.
2. Do not force low-contrast muted text on primary content areas.
3. Prefer `withLocalePrefix(...)` for all internal links.
4. Keep hover/focus states accessible (visible focus ring required).

## Accessibility Baseline
- WCAG 2.1 AA minimum contrast target.
- Interactive elements must be keyboard reachable.
- Loading states should expose `aria-busy`.

## Governance
1. Any new component must define: variants, sizes, states, a11y notes.
2. Any new page must consume existing atoms first; avoid one-off primitives.
3. Keep route links locale-safe (`/en/...`) through locale helpers.
4. Log major visual decisions in `ai-context/context/agents.md` and architecture notes in `docs/ui-architecture.md`.

## Rollout Status
- Token layer: integrated globally via `app/globals.css` import.
- Atomic UI base: added to `components/ui`.
- Frontend pages: now inherit token layer through locale layout and global styles.


