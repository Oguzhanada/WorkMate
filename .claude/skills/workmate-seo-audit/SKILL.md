---
name: workmate-seo-audit
description: Audit SEO metadata across all WorkMate pages. Checks for missing <title>, meta description, Open Graph tags, and JSON-LD structured data. Use when reviewing SEO completeness, preparing for launch, or after adding new pages.
metadata:
  severity: standard
  status: active
  last_synced: 2026-03-14
  synced_with: FD-11
---

# WorkMate SEO Audit

You are the SEO metadata auditor for WorkMate. Your job is to scan all pages under `app/[locale]/` and verify that every route has correct, complete SEO metadata.

---

## What to Check

### 1) Page-level `metadata` export or `generateMetadata()`
Every page under `app/[locale]/` must export either:
- A static `metadata` object, OR
- A `generateMetadata()` async function

Check for:
- **title** — must be present and descriptive (not empty or generic like "Page")
- **description** — must be present and between 50–160 characters
- **openGraph.title** — must match or complement the page title
- **openGraph.description** — must be present
- **openGraph.type** — should be set (default: `"website"`)
- **openGraph.url** — should use the canonical URL pattern

### 2) Layout-level metadata (root + locale)
Check `app/layout.tsx` and `app/[locale]/layout.tsx` for:
- Default `metadata` with fallback title template (e.g., `"%s | WorkMate"`)
- Default description
- `metadataBase` — must be set for OG image resolution
- `openGraph` defaults including `siteName`

### 3) JSON-LD structured data
Check for `<JsonLd>` component usage on key pages:
- Homepage → `WebSite` schema
- Service/category pages → `Service` schema
- Provider profile → `LocalBusiness` or `Person` schema
- Job detail → `JobPosting` schema (if applicable)

Reference: `components/seo/JsonLd.tsx`

### 4) OG image route
Verify `app/og/route.tsx` exists and generates dynamic OG images.

---

## Audit Procedure

When activated, run these searches:

Use Claude Code's built-in tools (not bash commands):

1. **Find all page.tsx files under [locale]:**
   Use **Glob** with pattern `marketplace/app/[locale]/**/page.tsx`

2. **Check which pages export metadata or generateMetadata:**
   Use **Grep** with pattern `export.*metadata|generateMetadata` and glob `marketplace/app/[locale]/**/page.tsx`
   Files NOT in the output are violations (missing metadata).

3. **Check for OG tags in metadata exports:**
   Use **Grep** with pattern `openGraph` and glob `marketplace/app/[locale]/**/*.tsx`
   Compare against total page count — missing files need OG tags.

4. **Check for JSON-LD usage on key pages:**
   Use **Grep** with pattern `JsonLd|jsonLd|json-ld` and glob `marketplace/app/[locale]/**/page.tsx`

5. **Verify metadataBase in root layout:**
   Use **Grep** with pattern `metadataBase` in files `marketplace/app/layout.tsx` and `marketplace/app/[locale]/layout.tsx`

6. **Check for empty/placeholder titles:**
   Use **Grep** with pattern `title.*:\s*['"]"` and glob `marketplace/app/[locale]/**/*.tsx`

---

## Report Format

After scanning, produce a concise table:

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
2. [actionable fix]
```

---

## Rules

- Do NOT create report files (FD-24) — output results directly in conversation
- All metadata must be in English only (guardrail §1)
- OG URLs must use locale-aware paths, never hardcoded `/en/` (FD-11)
- The `metadataBase` should reference `NEXT_PUBLIC_PLATFORM_BASE_URL` env var
- JSON-LD locale references must use dynamic `/${locale}/` paths, not `/en/`
- This skill is read-only by default — it audits and reports, then asks before making fixes

---

## Quick Fix Patterns

When fixing missing metadata, use these patterns:

### Static metadata export
```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'A clear description between 50-160 characters for this page.',
  openGraph: {
    title: 'Page Title',
    description: 'A clear description between 50-160 characters for this page.',
    type: 'website',
  },
};
```

### Dynamic metadata with generateMetadata
```tsx
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Dynamic Title',
    description: 'Dynamic description based on data.',
    openGraph: {
      title: 'Dynamic Title',
      description: 'Dynamic description based on data.',
      type: 'website',
      url: `/${locale}/path`,
    },
  };
}
```
