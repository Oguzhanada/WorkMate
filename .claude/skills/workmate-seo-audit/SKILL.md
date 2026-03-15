---
name: workmate-seo-audit
description: Use when auditing SEO metadata completeness, preparing for launch, or after adding new pages to WorkMate.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# WorkMate SEO Audit

## Where to Look

- Pages: `marketplace/app/[locale]/**/page.tsx`
- Root layout: `marketplace/app/layout.tsx`
- Locale layout: `marketplace/app/[locale]/layout.tsx`
- JSON-LD component: `marketplace/components/seo/JsonLd.tsx`
- OG image route: `marketplace/app/og/route.tsx`
- Shared guardrails: `.claude/skills/references/workmate-shared-guardrails.md`

## What to Check

### Page-level metadata
Every page under `marketplace/app/[locale]/` must export a static `metadata` object or a `generateMetadata()` function. Verify:
- **title** — present and descriptive (not empty or generic).
- **description** — present, 50–160 characters.
- **openGraph** — title, description, type (`"website"` default), url (canonical pattern).

### Layout-level metadata
Check root and locale layouts for: fallback title template, default description, `metadataBase` (referencing `NEXT_PUBLIC_PLATFORM_BASE_URL`), `openGraph` defaults with `siteName`.

### JSON-LD structured data
Check key pages for `<JsonLd>` usage: Homepage (`WebSite`), service/category pages (`Service`), provider profile (`LocalBusiness`/`Person`), job detail (`JobPosting`).

### OG image route
Verify `marketplace/app/og/route.tsx` exists and generates dynamic OG images.

## Procedure

### Audit Steps

1. **Find all pages:** Glob `marketplace/app/[locale]/**/page.tsx`.
2. **Check metadata exports:** Grep `export.*metadata|generateMetadata` in `marketplace/app/[locale]/**/page.tsx`. Files absent from results are violations.
3. **Check OG tags:** Grep `openGraph` in `marketplace/app/[locale]/**/*.tsx`. Compare against total page count.
4. **Check JSON-LD:** Grep `JsonLd|jsonLd|json-ld` in `marketplace/app/[locale]/**/page.tsx`.
5. **Verify metadataBase:** Grep `metadataBase` in `marketplace/app/layout.tsx` and `marketplace/app/[locale]/layout.tsx`.
6. **Check empty titles:** Grep `title.*:\s*['"]"` in `marketplace/app/[locale]/**/*.tsx`.

### Report Format

```
SEO AUDIT — [date]

Pages scanned: [N]
Pages with metadata export: [N] / [N]
Pages with OG tags: [N] / [N]
Pages with JSON-LD: [N] / [N]
metadataBase set: yes/no

MISSING METADATA:
| Page path | Missing |
|-----------|---------|
| app/[locale]/some/page.tsx | title, description, OG |

RECOMMENDATIONS:
1. [actionable fix]
```

### Quick Fix Patterns

Quick fix patterns: see existing pages with metadata exports as examples. Canonical pattern: read `marketplace/app/[locale]/layout.tsx` and any `page.tsx` with `generateMetadata()` for reference.

## Rules

- Do NOT create report files (FD-24) — output results directly in conversation.
- All metadata must be in English only (guardrail §1).
- OG URLs must use locale-aware paths, never hardcoded `/en/` (FD-11).
- JSON-LD locale references must use dynamic `/${locale}/` paths, not `/en/`.
- This skill is read-only by default — audit and report, then ask before making fixes.

## NEVER DO

- Never hardcode `/en/` in OG URLs or JSON-LD paths.
- Never create report files — output to conversation only.
- Never apply fixes without asking first.
