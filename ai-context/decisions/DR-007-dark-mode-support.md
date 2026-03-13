# DR-007: Dark Mode Support — FD-14 Update

- **Date:** 2026-03-12
- **Status:** Accepted
- **Owner:** WorkMate maintainers
- **Supersedes:** FD-14 (light-only lock)

## Decision

Dark mode is now supported. The `[data-theme="dark"]` mechanism can be toggled in `layout.tsx`; the `prefers-color-scheme: dark` media query also automatically activates the dark tokens.

## Rationale

Dark mode tokens were fully implemented in `marketplace/tokens.css` lines 167–176. However, the `@media (prefers-color-scheme: dark)` block in `globals.css` lines 337–362 was forcibly preserving light colours to prevent a past contrast regression. Since all components will be tested against dark mode as part of the full UI overhaul, this lock is no longer needed.

## New Rule (replaces FD-14)

- Light theme is the default: `<html data-theme="light">` is set statically in `layout.tsx`.
- Dark mode activates via the `[data-theme="dark"]` toggle or via `prefers-color-scheme: dark`.
- Token coverage is complete in `tokens.css` — do not use Tailwind `dark:` utility classes; use only `--wm-*` tokens.
- All new component changes must pass visual QA in both dark and light mode.

## Impact Analysis

- `globals.css` dark media query block: light override removed; `[data-theme="dark"]` tokens take effect.
- `layout.tsx`: `data-theme="light"` added to the `<html>` tag (may already be present).
- `components/ui/` all primitives: dark mode token compatibility verified.
- Playwright QA: all critical pages verified via screenshot in both light and dark mode.
