# DR-008: loading.tsx Scope Clarification — FD-02 Refinement

- **Date:** 2026-03-12
- **Status:** Accepted
- **Owner:** WorkMate maintainers
- **Refines:** FD-02

## Decision

`loading.tsx` is only required on pages that contain async Supabase/DB calls. Fully static pages (those that only call `getTranslations()`) are exempt.

## Rationale

FD-02 said "every data-fetching page", but fully static pages such as `terms`, `pricing`, `how-it-works`, and `about` were unnecessarily carrying `loading.tsx`. Because these pages make no Supabase calls, the loading state is never actually shown — it only adds file bloat.

## New Rule (refines FD-02)

**Required:** `loading.tsx` — for all pages that make async Supabase/DB queries.

**Exempt:** Static pages that only call `getTranslations()` (next-intl) with no Supabase connection.
Current exempt pages: `terms`, `pricing`, `how-it-works`, `about`.

**Decision criterion:** Does the page call `createServerClient()` or `createClient()` (Supabase)?
- Yes → `loading.tsx` required
- No → optional

## Implementation

Deleted `loading.tsx` files:
- `app/[locale]/terms/loading.tsx`
- `app/[locale]/pricing/loading.tsx`
- `app/[locale]/how-it-works/loading.tsx`
- `app/[locale]/about/loading.tsx`
