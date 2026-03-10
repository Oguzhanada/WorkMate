# CloudDash Design System

## Overview
CloudDash design system provides a scalable foundation for B2B SaaS UI across product surfaces with token-driven styling, React + TypeScript primitives, and dark mode support.

## Included Files
- `tokens.json`: source-of-truth design tokens (Figma/Style Dictionary compatible)
- `tokens.css`: CSS custom properties (light + dark)
- `components/Button.tsx`
- `components/Input.tsx`
- `components/Card.tsx`

## Foundations

### Colors
- Brand primary: `#6366F1`
- Neutral scale for data-heavy SaaS screens
- Semantic colors for status and alerts

### Spacing
- 8px-based scale with 4px micro-step support

### Typography
- Inter for heading/body
- JetBrains Mono for code/data cells

### Radius & Elevation
- Small/medium/large radius tiers
- Four elevation levels for cards and overlays

## Dark Mode
- Explicit theme via `[data-theme="dark"]`
- Optional system fallback via `prefers-color-scheme`
- Keep contrast at WCAG 2.1 AA minimum

## React Component Guidance

### Button
- Variants: `primary`, `secondary`, `ghost`, `danger`
- Sizes: `sm`, `md`, `lg`
- States: default, disabled, loading
- Accessibility: `aria-busy`, keyboard-accessible by default

### Input
- Label + error states
- Accessible `label` / `htmlFor` mapping

### Card
- Content container for tables, analytics widgets, and summaries
- Structured with optional title/subtitle/actions

## Usage
1. Import `tokens.css` globally.
2. Wrap app with `data-theme="light"` (or `dark`).
3. Use primitives from `components/*` as base atoms.
4. Build molecules/organisms on top; do not hardcode color values in feature code.

## Governance
- Token-first changes only
- Component API changes require version bump and changelog
- New variants must include accessibility notes and examples
