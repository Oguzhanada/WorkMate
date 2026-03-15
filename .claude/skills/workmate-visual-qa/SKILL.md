---
name: workmate-visual-qa
description: Visual QA workflow for WorkMate UI changes. Use when reviewing or shipping frontend updates to verify interaction polish, performance gates via Lighthouse, and to prepare quality evidence for PRs.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# WorkMate Visual QA

## Workflow

1. Scope review
- Identify touched user-facing pages/components.
- Prioritize high-traffic flows (home, jobs, post-job, profile, dashboard, providers).

2. UX quality checks
- Verify spacing rhythm, typography hierarchy, hover/focus/pressed states, and empty/loading states.
- Verify mobile and desktop parity.
- Verify dark mode parity on touched views.
- Confirm all `--wm-*` design tokens used correctly (no hardcoded hex).

3. Performance/quality gate
- Run Lighthouse CI (nightly workflow) and review score regressions.
- Treat Lighthouse regressions as actionable (not merge-blocking, but tracked).

4. Release evidence
- Attach artifact links/screenshots in PR notes.
- List approved intentional visual changes to avoid review ambiguity.

## Required Gates

- Lighthouse CI: nightly performance gate (`.github/workflows/lighthouse.yml`)
- Lint + tests: pass

---

## UX Quality Checklist

**Spacing and Typography**
- [ ] Consistent spacing rhythm (4/8/16/24/32px scale), no orphaned overrides
- [ ] Read root `layout.tsx` and `app/tokens.css` for current font stack
- [ ] Sequential heading hierarchy (no h1 -> h3 skips), readable line lengths (45-75 chars)
- [ ] No content overflow on any viewport (320px-2560px)

**Interactive States**
- [ ] All clickable elements have hover, focus, and pressed states
- [ ] Focus rings visible (never removed without replacement), smooth transitions (150-300ms)
- [ ] Disabled states visually distinct (reduced opacity, no pointer cursor)

**Empty, Loading, and Error States**
- [ ] Every data-dependent view has a loading skeleton or spinner
- [ ] Empty states show helpful messaging with a CTA where appropriate
- [ ] Error states show user-friendly messages (no raw error codes)

**Mobile/Desktop Parity**
- [ ] All features accessible on both viewports, touch targets >= 44x44px on mobile
- [ ] Tables use horizontal scroll or card layout on mobile — no breakage

**Dark Mode Parity**
- [ ] All touched views correct under `data-theme="dark"`, no white flashes
- [ ] Text contrast meets WCAG AA (4.5:1 body, 3:1 large text)

**Token Compliance**
- [ ] All colors use `--wm-*` tokens — no hardcoded hex
- [ ] No Tailwind `dark:` utilities, no raw `gray/zinc/slate-*` classes

---

## Audit Procedure

Use Claude Code built-in tools (not bash commands):

1. **Hardcoded colors:** Grep `#[0-9a-fA-F]{3,8}` in `marketplace/**/*.tsx` — exclude `tokens.css`. Matches are violations.
2. **Tailwind dark: utilities:** Grep `dark:` in `marketplace/**/*.tsx` — all matches violate DR-007.
3. **Missing loading states:** Grep `useQuery|useSWR|fetch\(` in `marketplace/**/*.tsx`, then cross-reference with Grep `Skeleton|Spinner|Loading` in the same files. No loading UI = violation.
4. **Raw Tailwind greys:** Grep `(gray|zinc|slate)-\d{2,3}` in `marketplace/**/*.tsx` — replace with `--wm-neutral-*`.
5. **Missing focus styles:** Grep `outline-none` in `marketplace/**/*.tsx` — verify each has a replacement focus ring.
6. **Empty state coverage:** Glob `marketplace/**/Empty*.tsx` and `marketplace/**/NoData*.tsx` — compare against pages rendering lists/tables.

---

## Where to Look

- Design tokens: `app/tokens.css`
- Lighthouse workflow: `.github/workflows/lighthouse.yml`
- UI wrappers: `components/ui/`
- Font imports: root `layout.tsx`

---

## Report Format

```
VISUAL QA AUDIT — [date]
Pages reviewed: [N] | Token violations: [N] | Dark mode issues: [N]
Missing loading states: [N] | Missing empty states: [N]

ISSUES:
| File | Issue | Severity |
|------|-------|----------|
| components/SomeCard.tsx | Hardcoded #333 on line 42 | high |

RECOMMENDATIONS:
1. [actionable fix]
```

---

## Common Anti-Patterns

- **Hardcoded hex colors** — breaks dark mode. Use `var(--wm-*)`.
- **Missing loading/empty states** — data views with no skeleton or empty-state CTA.
- **Removed focus outlines** (`outline-none` without replacement) — breaks keyboard a11y.
- **Inconsistent border-radius** — mixing `rounded-lg`/`rounded-xl`/`rounded-2xl` on siblings.
- **Raw Tailwind color classes** (`text-gray-500`, `bg-zinc-100`) — use `--wm-neutral-*`.
- **Fixed pixel widths** on responsive containers — causes overflow on small screens.
- **Missing hover/pressed states** on buttons and links.

---

## NEVER DO

- Never approve a PR with hardcoded hex colors outside `tokens.css`.
- Never skip dark mode verification on touched views.
- Never remove focus outlines without providing a replacement focus indicator.
- Never use Tailwind `dark:` utilities — WorkMate uses `[data-theme="dark"]` selectors.

---

## Pre-Commit Checklist

Before marking a frontend PR ready for review:

- [ ] All new/touched components use `--wm-*` tokens exclusively (no hardcoded hex)
- [ ] Loading and empty states exist for every data-dependent view
- [ ] Dark mode renders correctly on all touched pages (`data-theme="dark"`)
- [ ] Mobile layout tested at 375px viewport — no overflow or broken layouts
- [ ] All interactive elements have hover, focus, and disabled states
- [ ] No Lighthouse score regressions on affected pages
- [ ] Intentional visual changes documented in PR description with screenshots
