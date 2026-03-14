# DR-012: Token System Expansion — Status, Admin, Chart, Neutral Families

- **Date:** 2026-03-14
- **Status:** Accepted
- **Owner:** WorkMate maintainers
- **Strengthens:** FD-03 (CSS tokens only)

## Decision

The `--wm-*` token system in `tokens.css` is expanded with four new token families to close gaps that were forcing developers to hardcode hex values:

1. **Status/Alert tokens** (`--wm-status-{success,warning,error,info}-{light,border,text}`) — used by AlertBanner, Toast, Badge, and any status indicator.
2. **Admin tokens** (`--wm-admin-{bg,surface,border,text,text-hover,accent}`) — used by admin sidebar, dashboard panels.
3. **Chart tokens** (`--wm-chart-{emerald,navy,blue,violet,amber,rose,sky,purple,pink}`) — used by analytics charts, data visualizations.
4. **Neutral shorthand tokens** (`--wm-neutral-{50..900}`, `--wm-white`) — frequently hardcoded neutrals now have `--wm-` prefixed aliases.
5. **Social brand tokens** (`--wm-social-facebook`, `--wm-social-google`) — OAuth button colors.

All new families include dark mode remapping in `[data-theme="dark"]`.

## Rationale

Independent audit (2026-03-14) found 429 hardcoded hex values across 31 CSS modules and ~140 in TSX files. Root cause analysis showed the violations were not developer negligence — the token system lacked coverage for status colors, admin UI, chart palettes, and common neutrals, forcing fallback to raw hex.

FD-03 ("no hardcoded hex") cannot be enforced if tokens don't exist for the needed colors.

## New Rule (strengthens FD-03)

- FD-03 now includes: **all color families listed above must be used**. No new hex values may be introduced without first adding a corresponding `--wm-*` token.
- When a needed color has no token, add the token to `tokens.css` first (with dark mode override), then reference it.
- Legacy `--wm-amber-*` aliases remain but are deprecated in favor of `--wm-gold-*`.

## Impact Analysis

- `tokens.css`: ~70 new token definitions added to `:root` and `[data-theme="dark"]`.
- 31 CSS module files: all hardcoded hex migrated to token references.
- TSX files: AlertBanner, Toast, Admin* components migrated to token references.
- Dark mode: light variant tokens (`--wm-primary-light`, `--wm-gold-light`, etc.) now correctly remap to dark-appropriate values.
