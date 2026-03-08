# WorkMate — Session 19 Checkpoint
**Date**: 2026-03-07
**Session**: 19 (Production Launch — Group C Automation)
**Status**: COMPLETE

---

## What Was Built This Session

### 1. JobPosting schema.org Structured Data
- **`marketplace/app/[locale]/jobs/[jobId]/page.tsx`** — Added `<script type="application/ld+json">` with JobPosting schema:
  - `title`, `description`, `datePosted`, `validThrough` (created_at + 30 days)
  - `hiringOrganization`: WorkMate, sameAs from `NEXT_PUBLIC_PLATFORM_BASE_URL`
  - `jobLocation.address`: addressCountry "IE", addressRegion from `job.county ?? job.locality`
  - `employmentType`: "CONTRACTOR"
  - `baseSalary`: omitted — budget stored as text string (`budget_range`), not cents

### 2. GDPR Legal Pages
- **`marketplace/app/[locale]/privacy/page.tsx`** — Full Privacy Policy (9 sections):
  - GDPR Art. 6 legal basis, DPC (Ireland) complaint rights
  - Data sharing: Stripe, Resend, Supabase — no data sale
  - Retention: active + 7 years post-closure
- **`marketplace/app/[locale]/terms/page.tsx`** — Full Terms & Conditions (12 sections), rewrote broken stub:
  - Irish law, Garda vetting obligations, Stripe Connect, platform fees
  - Prohibited conduct, limitation of liability
- **`marketplace/app/[locale]/privacy/loading.tsx`** — Skeleton placeholder
- **`marketplace/app/[locale]/terms/loading.tsx`** — Skeleton placeholder
- **`marketplace/components/site/SiteFooter.tsx`** — Updated footer link `/privacy-policy` to `/privacy`

### 3. CodeQL GitHub Actions
- **`.github/workflows/codeql.yml`** — push/PR to main + weekly Monday 3am UTC
  - `javascript-typescript` analyzer, `security-and-quality` query suite
  - `github/codeql-action@v3`, `actions/checkout@v4`

### 4. Dependabot
- **`.github/dependabot.yml`** — npm (`/marketplace`) + github-actions (`/`)
  - Weekly Monday 04:00 Europe/Dublin
  - Grouped: `production-deps` (Next, React, Supabase, Stripe, Zod) + `dev-tools` (Playwright, Vitest, TypeScript, ESLint, Tailwind)
  - Ignore: `eslint >=10`, `@supabase/ssr >=0.9`
  - PR limits: 5 npm, 3 GitHub Actions

---

## Files Created / Modified This Session

| File | Action |
|---|---|
| `marketplace/app/[locale]/jobs/[jobId]/page.tsx` | Edited — JobPosting JSON-LD |
| `marketplace/app/[locale]/privacy/page.tsx` | Created |
| `marketplace/app/[locale]/privacy/loading.tsx` | Created |
| `marketplace/app/[locale]/terms/page.tsx` | Rewritten (was broken stub) |
| `marketplace/app/[locale]/terms/loading.tsx` | Created |
| `marketplace/components/site/SiteFooter.tsx` | Edited — footer link fix |
| `.github/workflows/codeql.yml` | Created |
| `.github/dependabot.yml` | Created |

### Also committed (session 18 backlog):
| File | Action |
|---|---|
| `backstop.json` | Created |
| `.github/workflows/backstop.yml` | Created |
| `.github/workflows/lighthouse.yml` | Created |
| `.gitignore` | Edited |
| `marketplace/next.config.ts` | Edited — security headers |
| `marketplace/app/[locale]/layout.tsx` | Edited — OG/Twitter meta |
| `marketplace/next-sitemap.config.js` | Created |
| `marketplace/public/robots.txt` | Created |
| `marketplace/.lighthouserc.js` | Created |
| `marketplace/eslint.config.mjs` | Created |
| `marketplace/package.json` | Edited |
| `docs/DB_RUNBOOK.md` | Created |
| `tests/unit/api-schemas.test.ts` | Created |
| `tests/unit/job-access.test.ts` | Created |
| `tests/unit/feature-flags.test.ts` | Created |
| `tests/e2e/smoke/auth-registration.spec.ts` | Created |
| `tests/e2e/smoke/profile-edit.spec.ts` | Created |
| `tests/e2e/smoke/offer-lifecycle.spec.ts` | Created |
| `tests/e2e/smoke/error-scenarios.spec.ts` | Created |

---

## Production Launch Checklist — Updated Status

| # | Area | Status | Notes |
|---|---|---|---|
| 1 | BackstopJS visual tests | Done (automated) | Run `test:visual:ref` locally first to generate reference images |
| 2 | Lighthouse CI | Done (automated) | Warns only, no PR block |
| 2 | Lighthouse manual | Manual | Run on production URL post-deploy |
| 3 | Security headers | Done | 6 headers in next.config.ts |
| 3 | CodeQL | Done | `.github/workflows/codeql.yml` push/PR/weekly |
| 3 | Dependabot | Done | `.github/dependabot.yml` grouped npm + actions |
| 3 | HTTPS / SSL | Manual | Vercel auto-handles on custom domain |
| 4 | Functional tests | Done | E2E + unit suite |
| 4 | Responsive / browser | Manual | — |
| 5 | ESLint | Done | `npm run lint:eslint` |
| 5 | npm outdated | Done | All current, 3 minor gaps documented |
| 6 | DB runbook | Done | `docs/DB_RUNBOOK.md` |
| 6 | Supabase backups | Manual | Enable Pro plan PITR in Supabase dashboard |
| 7 | SEO meta/OG | Done | layout.tsx + sitemap + robots.txt |
| 7 | Structured data | Done | JobPosting schema.org on job detail page |
| 8 | UX testing | Manual | 3-5 real users |
| 9 | Legal / GDPR | Done | Privacy Policy + Terms at /privacy + /terms |
| 10 | Domain / hosting | Manual | workmate.ie + Vercel |
| 10 | CI/CD deploy | Done (existing) | workmate-ci-tests.yml already set up |
| 11 | Final checks | Manual | Post-deploy verification |

---

## Git Status
- Branch: `main`
- Commits this session: `6d26a37` (session 18 backlog), `ef615bf` (session 19)
- All files committed — working tree clean

## Remaining Manual Actions
1. **BackstopJS bootstrap** — dev server açıkken `npm run test:visual:ref` -> `backstop_data/bitmaps_reference/` commit et
2. **GitHub Secrets** — repo Settings -> Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Lighthouse CI)
3. **Supabase backups** — Pro plan PITR enable
4. **Domain** — workmate.ie + Vercel
5. **UX testing** — 3-5 real users
6. **Responsive/browser** — Safari, Firefox, mobile
7. **Old stub cleanup** — `app/[locale]/privacy-policy/` silinebilir (footer linki artık /privacy)
