---
name: workmate-front-engineer
description: Build WorkMate marketplace UI components with the Ireland design system and --wm-* token system. Use when creating or styling pages, React components, or layouts specific to WorkMate.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

## WorkMate Design Identity

Ireland-first, premium-but-approachable. Clean and trustworthy — users are hiring tradespeople, not browsing art.

- **Tone**: Professional, warm, trustworthy. Ireland Emerald (#169B62) as primary accent, Navy (#1B2A4A) for depth, Gold (#D4A847) for highlights.
- **Typography**: Poppins for headings (`--wm-font-heading`), Plus Jakarta Sans for body (`--wm-font-sans`), JetBrains Mono for code (`--wm-font-mono`). Read root `layout.tsx` for Google Fonts import.
- **Motion**: Framer Motion for page transitions and micro-interactions. CSS transitions for hover/focus states (150-300ms). One orchestrated page load > scattered animations.
- **Spatial Composition**: Generous whitespace, consistent 8px spacing scale. Cards with soft shadows (`--wm-shadow-*`). Grid default `sm:grid-cols-2 lg:grid-cols-3` (FD-07).

## WorkMate Design System

### Design Tokens

Design tokens: read `app/tokens.css` for the canonical `--wm-*` token palette. Key families: primary (emerald), navy, gold, status, admin, chart, neutral, text, surfaces. All dark mode overrides are in the same file under `[data-theme='dark']`.

### Typography

Font stack: read root `layout.tsx` Google Fonts import for current typography. Tokens for font families are in `app/tokens.css`.

### Themes

- `data-theme="light"` — Ireland palette (default)
- `data-theme="dark"` — dark mode (all `--wm-*` tokens adapt)
- `data-theme="b"` — OnTask brand (royal blue, pure white)

### Token Usage Rules

```tsx
// CORRECT — token-based, theme-aware:
<p style={{ color: 'var(--wm-text-primary)' }}>
<button style={{ background: 'var(--wm-emerald)' }}>

// WRONG — hardcoded, breaks dark mode:
<p className="text-gray-900">
<button className="bg-[#169B62]">
```

### No New Hex Without a Token

Never introduce a hardcoded hex value in component code. If the needed color lacks a `--wm-*` token, first add one to `app/tokens.css` with a corresponding dark-mode override, then consume via `var(--wm-*)`.

### TypeScript Strict Mode

Read `tsconfig.json` — `strict: true` is enabled. All new components and hooks must be fully type-safe. No `any` casts, no `@ts-ignore`, no `as unknown as X` escape hatches unless justified with an inline comment.

### Component Architecture — Custom Hooks Pattern

Decompose large components into focused custom hooks. Reference implementations:

- **`AdminApplicationsPanel`** (`components/dashboard/AdminApplicationsPanel.tsx`) — logic extracted into `hooks/useApplicationsData`, `hooks/useApplicationFilters`, `hooks/useApplicationActions`, `hooks/useApplicationStats`.
- **`SignUpForm`** (`components/auth/SignUpForm.tsx`) — logic extracted into `hooks/useSignUpFormState`, `hooks/useSignUpSubmit`, `hooks/useEircodeValidation`.

Follow this pattern when a component exceeds ~200 lines or manages multiple concerns.

## Where to Look

- Design tokens: `app/tokens.css`
- Font imports: root `layout.tsx`
- UI wrappers: `components/ui/`
- Frozen decisions: `ai-context/decisions/`
- TypeScript config: `tsconfig.json`

## NEVER DO

- Never use generic fonts (Inter, Roboto, Arial) in WorkMate UI.
- Never hardcode hex colors — add a `--wm-*` token to `app/tokens.css` first.
- Never use Tailwind `dark:` utilities — use `[data-theme="dark"]` selectors in `tokens.css`.
- Never skip dark mode support on new or touched components.
- Never converge on overused choices (Space Grotesk, purple-on-white gradients) across generations.
