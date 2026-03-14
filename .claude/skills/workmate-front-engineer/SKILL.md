---
name: workmate-front-engineer
description: Build WorkMate marketplace UI components with the Ireland design system and --wm-* token system. Use when creating or styling pages, React components, or layouts specific to WorkMate. For general web design outside WorkMate, the user-level frontend-design skill applies instead.
license: Complete terms in LICENSE.txt
metadata:
  severity: standard
  status: active
  last_synced: 2026-03-14
  synced_with: FD-03, FD-04, FD-13, FD-14, FD-31, DR-007, DR-012
---

This skill guides creation of WorkMate marketplace UI using the Ireland design system (`--wm-*` tokens, Poppins/Plus Jakarta Sans, emerald/navy/cream/gold palette). All output must conform to the WorkMate token system and frozen decisions (FD-03, FD-13, FD-14).

> **Note:** The design thinking section below provides supplementary creative guidance for WorkMate UI work. For the WorkMate-specific token system and component patterns, see the "WorkMate Design System" section further below.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

---

## WorkMate Design System (S39 Ireland Overhaul — 2026-03-12)

When building **WorkMate-specific** interfaces, always use the Ireland design system:

### Token Palette (CSS custom properties — never hardcoded hex)

All tokens are defined in `app/tokens.css` with automatic dark-mode overrides via `[data-theme="dark"]`.

**Primary (Emerald / Irish Green)**
| Token | Light | Use |
|-------|-------|-----|
| `--wm-primary` | `#169B62` | Primary action, CTAs |
| `--wm-primary-dark` | `#0D6B45` | Hover / pressed states |
| `--wm-primary-mid` | `#0e8a57` | Mid-tone accent |
| `--wm-primary-light` | `#D1FAE5` | Tinted backgrounds |
| `--wm-primary-faint` | `#edfaf3` | Very subtle tinted bg |
| `--wm-primary-rgb` | `22, 155, 98` | For `rgba()` usage |

**Navy**
| Token | Light | Use |
|-------|-------|-----|
| `--wm-navy` | `#1B2A4A` | Headings, nav, trust elements |
| `--wm-navy-mid` | `#2D4A7A` | Mid-tone nav accent |
| `--wm-navy-soft` | `#3d5f94` | Softer navy for hover |
| `--wm-navy-rgb` | `27, 42, 74` | For `rgba()` usage |

**Gold / Accent**
| Token | Light | Use |
|-------|-------|-----|
| `--wm-gold` | `#D4A847` | Badges, founding pro accents |
| `--wm-gold-dark` | `#b08930` | Hover / pressed gold |
| `--wm-gold-light` | `#fef3c7` | Gold-tinted background |
| `--wm-gold-faint` | `#fffbeb` | Very subtle gold bg |
| `--wm-gold-rgb` | `212, 168, 71` | For `rgba()` usage |

**Blue**
| Token | Light | Use |
|-------|-------|-----|
| `--wm-blue` | `#2563eb` | Informational links, info state |
| `--wm-blue-dark` | `#1d4ed8` | Hover / pressed blue |
| `--wm-blue-soft` | `#eff6ff` | Blue-tinted background |
| `--wm-blue-rgb` | `37, 99, 235` | For `rgba()` usage |

**Destructive**
| Token | Light | Use |
|-------|-------|-----|
| `--wm-destructive` | `#EF4444` | Delete actions, errors |
| `--wm-destructive-dark` | `#b91c1c` | Hover / pressed destructive |
| `--wm-destructive-light` | `#fef2f2` | Error-tinted background |
| `--wm-destructive-rgb` | `239, 68, 68` | For `rgba()` usage |

**Status** -- use for alerts, toasts, badges, inline banners
| Token pattern | Variants |
|---------------|----------|
| `--wm-status-{level}-light` | Background fill |
| `--wm-status-{level}-border` | Border color |
| `--wm-status-{level}-text` | Text/icon color |

Where `{level}` is one of: `success`, `warning`, `error`, `info`. Dark mode remaps these to translucent/bright values automatically.

**Admin** -- use for admin sidebar, admin dashboard surfaces
| Token | Use |
|-------|-----|
| `--wm-admin-bg` | Sidebar background (`#0f172a`) |
| `--wm-admin-surface` | Card/panel surface (`#1e293b`) |
| `--wm-admin-border` | Dividers (`#334155`) |
| `--wm-admin-text` | Default text (`#94a3b8`) |
| `--wm-admin-text-hover` | Hover/active text (`#e2e8f0`) |
| `--wm-admin-accent` | Active indicator (`#34d399`) |

**Chart / Data-viz** -- use for charts, graphs, data visualizations
| Token | Color |
|-------|-------|
| `--wm-chart-emerald` | Primary green |
| `--wm-chart-navy` | Navy |
| `--wm-chart-blue` | `#0ea5e9` |
| `--wm-chart-violet` | `#7c3aed` |
| `--wm-chart-violet-soft` | `#f1efff` |
| `--wm-chart-violet-dark` | `#5b21b6` |
| `--wm-chart-amber` | `#d97706` |
| `--wm-chart-amber-soft` | `#fffbeb` |
| `--wm-chart-rose` | `#e11d48` |
| `--wm-chart-sky` | `#0284c7` |
| `--wm-chart-purple` | `#8b5cf6` |
| `--wm-chart-pink` | `#ec4899` |

**Neutral** -- use instead of hardcoded greys or Tailwind `gray-*`/`zinc-*`
| Token | Light |
|-------|-------|
| `--wm-white` | `#ffffff` (remaps to `#1F2937` in dark) |
| `--wm-neutral-50` through `--wm-neutral-900` | Full grey scale (inverted in dark mode) |

**Social** -- use for OAuth / social login buttons
| Token | Use |
|-------|-----|
| `--wm-social-facebook` | Facebook button (`#1877f2`) |
| `--wm-social-facebook-hover` | Facebook hover |
| `--wm-social-google` | Google button (`#ea4335`) |
| `--wm-social-google-hover` | Google hover |

**Surfaces, Text, Borders** (unchanged)
| Token | Use |
|-------|-----|
| `--wm-bg` | Page background (cream light / dark) |
| `--wm-surface` | Card/panel background |
| `--wm-text-primary` / `--wm-text` | Body text |
| `--wm-muted` | Secondary text, labels |
| `--wm-text-soft` | Tertiary text |
| `--wm-border` / `--wm-border-soft` | Borders |

### Typography
- **Headings**: `Poppins` (loaded via Google Fonts)
- **Body**: `Plus Jakarta Sans`
- **Mono**: `JetBrains Mono`

### Themes
- `data-theme="light"` — Ireland palette (default)
- `data-theme="dark"` — dark mode (all `--wm-*` tokens adapt)
- `data-theme="b"` — OnTask brand (royal blue, pure white)

### Card Glassmorphism Pattern
```tsx
<div className="bg-[rgba(255,255,255,0.82)] backdrop-blur-[18px] rounded-2xl border border-white/40">
```

### Token Usage Rules
```tsx
// ✅ Correct — token-based, theme-aware:
<p style={{ color: 'var(--wm-text-primary)' }}>
<button style={{ background: 'var(--wm-emerald)' }}>

// ❌ Wrong — hardcoded, breaks dark mode:
<p className="text-gray-900">
<button className="bg-[#169B62]">
```

### Do NOT use Tailwind dark: utilities
WorkMate uses `data-theme` attribute, not Tailwind's `dark:` prefix. All dark mode adaptation happens via `--wm-*` token overrides in `tokens.css`.

### No new hex without a token (DR-012)
Never introduce a hardcoded hex value in component code. If the needed color does not yet have a `--wm-*` token, first add one to `app/tokens.css` with a corresponding dark-mode override in the `[data-theme="dark"]` block, then consume it via `var(--wm-*)`.

### TypeScript strict mode (FD-31)
The project uses `strict: true` in `tsconfig.json`. All new components and hooks must be fully type-safe -- no `any` casts, no `@ts-ignore`, no `as unknown as X` escape hatches unless justified with an inline comment.

### Component Architecture — Custom Hooks Pattern
Large components should be decomposed into focused custom hooks to keep the main component readable. Two reference implementations:

- **`AdminApplicationsPanel`** (`components/dashboard/AdminApplicationsPanel.tsx`) -- business logic extracted into `hooks/useApplicationsData`, `hooks/useApplicationFilters`, `hooks/useApplicationActions`, `hooks/useApplicationStats`.
- **`SignUpForm`** (`components/auth/SignUpForm.tsx`) -- form logic extracted into `hooks/useSignUpFormState`, `hooks/useSignUpSubmit`, `hooks/useEircodeValidation`.

Follow this pattern when a component exceeds ~200 lines or manages multiple concerns (data fetching, filtering, actions, derived state).
