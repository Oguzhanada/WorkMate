# WorkMate — Session 18 Checkpoint
**Date**: 2026-03-07
**Session**: 18 (Production Launch Preparation — Group A + Group B)
**Status**: Group A COMPLETE + Group B COMPLETE

---

## What Was Built This Session

### Group A — Fully Automated

#### 1. BackstopJS Visual Regression Testing
- **`backstop.json`** (repo root) — 6 scenarios (Homepage, Search, Providers, Login, Register, Post Job), 3 viewports (desktop 1440, tablet 768, mobile 375), 1% mismatch tolerance, dynamic element hiding (toasts, cookie banner, `<time>`, `[data-time]`), Playwright/Chromium engine
- **`.github/workflows/backstop.yml`** — PR-only trigger, build → start server → `backstop test`, `continue-on-error: true` for first run (no reference images yet), HTML report + bitmaps uploaded as artifact always
- **`.gitignore`** — Added backstop_data/bitmaps_test, html_report, ci_report (bitmaps_reference stays committed)

**Bootstrap instructions:**
```bash
# From repo root, with dev server running:
backstop reference --config=backstop.json
# Commit backstop_data/bitmaps_reference/ to repo
```

#### 2. SEO
- **`marketplace/app/[locale]/layout.tsx`** — Added `openGraph` (title, description, url, siteName, locale `en_IE`, type `website`), `twitter` (card `summary_large_image`), `robots` (index/follow), `icons` (favicon.ico)
- **`marketplace/next-sitemap.config.js`** — Uses `NEXT_PUBLIC_PLATFORM_BASE_URL`, generates robots.txt, excludes dashboard/post-job/profile/api routes, weekly changefreq, priority 0.7
- **`marketplace/public/robots.txt`** — Dev fallback (overwritten by next-sitemap on production build)
- **`marketplace/package.json`** — Added `"postbuild": "next-sitemap"` (auto-runs after every build)

#### 3. Security Headers
- **`marketplace/next.config.ts`** — Added `securityHeaders` constant + `async headers()` function applied to all routes:
  - `X-Frame-Options: SAMEORIGIN` (anti-clickjacking)
  - `X-Content-Type-Options: nosniff` (anti-MIME-sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self)`
  - `X-DNS-Prefetch-Control: on`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2-year HSTS)

#### 4. Code Quality
- **`marketplace/eslint.config.mjs`** — ESLint 9 flat config via `FlatCompat`, extends `next/core-web-vitals`, rules: `no-console: warn`, `@typescript-eslint/no-unused-vars: warn` (with `_` prefix suppress), `prefer-const: error`, `no-duplicate-imports: error`
- **`marketplace/package.json`** — Added `"lint:eslint": "next lint"` script
- **`package.json` devDependencies added**: `backstopjs ^6.3.25`, `next-sitemap ^4.2.3`, `@eslint/eslintrc ^3.3.5`

**npm outdated results** — virtually everything is current:
| Package | Gap | Action |
|---|---|---|
| `eslint` | 9.39 → 10.0.3 | Wait — major, potentially breaking |
| `@supabase/ssr` | 0.8 → 0.9 | Wait — check changelog first |
| `lucide-react` | 0.575 → 0.577 | Safe patch update, optional |

---

### Group B — Semi-automated (agent writes, human runs)

#### 5. Lighthouse CI
- **`.github/workflows/lighthouse.yml`** — PR-only, build → start server → `lhci autorun`, `continue-on-error: true` (warns but doesn't fail PR), artifact upload always
- **`marketplace/.lighthouserc.js`** — Audits `/en`, `/en/search`, `/en/providers`, `/en/login`, all assertions use `warn` at thresholds: performance ≥ 0.7, accessibility/best-practices/SEO ≥ 0.8
- **GitHub Secrets needed**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 6. Database Runbook
- **`docs/DB_RUNBOOK.md`** — 6 sections:
  1. Migration workflow (naming, apply via SQL Editor, verification queries, 021 collision note)
  2. Backup strategy (Supabase Pro daily, manual trigger, `pg_dump` command for critical tables)
  3. Rollback procedure (companion SQL files, PITR contact process)
  4. Data integrity checks (cascade rules, unique constraints, RLS audit query)
  5. Connection pool settings (PgBouncer transaction mode, port 6543 vs 5432)
  6. Emergency procedures (RLS disabled, data deleted, runaway query)

---

## Files Created / Modified This Session

| File | Action |
|---|---|
| `backstop.json` | Created |
| `.github/workflows/backstop.yml` | Created |
| `.github/workflows/lighthouse.yml` | Created |
| `.gitignore` | Edited — BackstopJS exclusions |
| `marketplace/next.config.ts` | Edited — security headers |
| `marketplace/app/[locale]/layout.tsx` | Edited — OG/Twitter/robots meta |
| `marketplace/next-sitemap.config.js` | Created |
| `marketplace/public/robots.txt` | Created |
| `marketplace/.lighthouserc.js` | Created |
| `marketplace/eslint.config.mjs` | Created |
| `marketplace/package.json` | Edited — new deps + scripts |
| `docs/DB_RUNBOOK.md` | Created |
| `tests/unit/api-schemas.test.ts` | Created (session 17) |
| `tests/unit/job-access.test.ts` | Created (session 17) |
| `tests/unit/feature-flags.test.ts` | Created (session 17) |
| `tests/e2e/smoke/auth-registration.spec.ts` | Created (session 17) |
| `tests/e2e/smoke/profile-edit.spec.ts` | Created (session 17) |
| `tests/e2e/smoke/offer-lifecycle.spec.ts` | Created (session 17) |
| `tests/e2e/smoke/error-scenarios.spec.ts` | Created (session 17) |

---

## Production Launch Checklist — Updated Status

| # | Area | Status | Notes |
|---|---|---|---|
| 1 | BackstopJS visual tests | ✅ Automated | Run `test:visual:ref` locally first |
| 2 | Lighthouse CI | ✅ Automated | Warns only, no PR block |
| 2 | Lighthouse manual | ⏳ Manual | Run on production URL post-deploy |
| 3 | Security headers | ✅ Done | All 6 headers in next.config.ts |
| 3 | CodeQL / Dependabot | ⏳ Manual | Enable in GitHub repo Settings |
| 3 | HTTPS / SSL | ⏳ Manual | Vercel auto-handles on custom domain |
| 4 | Functional tests | ✅ Done | E2E + unit suite (session 17) |
| 4 | Responsive / browser | ⏳ Manual | — |
| 5 | ESLint | ✅ Done | `npm run lint:eslint` |
| 5 | npm outdated | ✅ Checked | All current, 3 minor gaps documented |
| 6 | DB runbook | ✅ Done | `docs/DB_RUNBOOK.md` |
| 6 | Supabase backups | ⏳ Manual | Enable Pro plan PITR |
| 7 | SEO meta/OG | ✅ Done | layout.tsx + sitemap + robots.txt |
| 7 | Structured data | ⏳ Next | JobPosting schema.org for job listings |
| 8 | UX testing | ⏳ Manual | 3–5 real users |
| 9 | Legal / GDPR | ⏳ Manual | Privacy policy + T&Cs pages needed |
| 10 | Domain / hosting | ⏳ Manual | workmate.ie + Vercel |
| 10 | CI/CD deploy | ✅ Existing | workmate-ci-tests.yml already set up |
| 11 | Final checks | ⏳ Manual | Post-deploy verification |

---

## Git Status
- Branch: `main`
- Last commit: `51f69ce`
- Uncommitted: all session 17 + session 18 files
- Next: `npm install` to install new deps, then commit all

## Next Up
- Group C checklist items (manual): Domain, GDPR pages, UX testing
- Optional quick automation: JobPosting structured data (`app/[locale]/jobs/[id]/page.tsx`)
- `npm install` needed to pick up: `backstopjs`, `next-sitemap`, `@eslint/eslintrc`
