---
paths:
  - "marketplace/components/**/*.tsx"
  - "marketplace/app/**/page.tsx"
  - "marketplace/app/**/layout.tsx"
  - "marketplace/app/tokens.css"
  - "marketplace/app/globals.css"
---

# UI Token Rules

- Zero hardcoded hex — use `--wm-*` tokens from `tokens.css` (FD-03)
- No `text-zinc-*`, `text-gray-*` — use `--wm-text-muted/soft` (FD-13)
- Dark mode via `[data-theme="dark"]` CSS vars, never `dark:` utilities (FD-14)
- No container-level opacity on readable content (FD-15)
- `<Button>` component always, no raw `<button className="bg-...">` (FD-04)
- `<PageHeader>` on top-level page routes (FD-05)
- `<EmptyState>` on every list (FD-06)
- Grid default `sm:grid-cols-2 lg:grid-cols-3` — override needs `{/* DR-011: reason */}` comment (FD-07)
- `next/image` for static images, raw `<img>` only for blob/signed URLs with eslint-disable comment (FD-26)
- Canonical source: `ai-context/context/agents.md` section 6
