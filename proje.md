# Ada Marketplace - Project Handbook

This file is the single-source project context for any AI agent or developer taking over this repository.

## 1) Project Snapshot
- Name: `Ada Marketplace`
- Focus: Ireland-first services marketplace (customer <-> provider)
- Stack:
  - Next.js 16 (App Router, Turbopack)
  - TypeScript
  - Supabase (Auth, Postgres, RLS, Storage)
  - Stripe Connect (test mode, secure hold/capture flow)
  - next-intl (single locale active: `en`)
  - Zod (server-side API validation)

## 2) Current Product State
- Language: English only
- URL strategy: locale-prefix disabled (`/en` removed)
- Brand: `ADA Marketplace`
- Country selector removed (Ireland-only product direction)
- Top navigation simplified to two primary CTAs:
  - `Get Service` -> `/jobs`
  - `Become a provider` -> `/become-provider`

### Core flows available
- Auth: sign up, sign in, password reset
- Customer:
  - create job requests
  - view incoming quotes
  - accept quote
  - update job status
  - public and private messaging
- Provider:
  - onboarding application
  - lead feed (category/county matched)
  - lead actions (`saved`, `declined`, `hidden`)
  - quote submission (EUR)
- Admin:
  - provider application review panel
  - application detail view
  - signed document URL preview
  - placeholder AI verification endpoint
- Payments:
  - Stripe Checkout secure hold (`capture_method=manual`)
  - hold finalize on checkout success (`authorized` state)
  - capture after job completion

## 3) Business Rules
- Roles:
  - `customer`
  - `verified_pro`
  - `admin`
- Matching baseline:
  - provider receives leads by category + county
- Currency:
  - user-facing currency is EUR
  - DB stores money in cents (`*_amount_cents`)
- Commission:
  - controlled by `PLATFORM_COMMISSION_RATE`
  - currently defaulted to `0` for low-cost launch/testing

## 4) Ireland-Specific Direction (Must Keep)
- 26 counties + Eircode validation
- Address model: Street, Locality/Town, County, Eircode
- Matching order: County -> Town -> Eircode radius (incremental rollout)
- Provider verification checklist target:
  - Safe Pass
  - Public Liability Insurance (min EUR 6.5M)
  - Tax Clearance Certificate
  - PPS Number
  - trade-specific licenses (Safe Electric, RGI, etc.)
- Badge logic: `Verified + Insured` after admin approval

## 5) Key Paths
### Core app/i18n
- `marketplace/app/[locale]/layout.tsx`
- `marketplace/proxy.ts`
- `marketplace/i18n/config.ts`
- `marketplace/i18n/request.ts`

### Auth/profile
- `marketplace/app/[locale]/login/page.tsx`
- `marketplace/app/[locale]/sign-up/page.tsx`
- `marketplace/app/[locale]/forgot-password/page.tsx`
- `marketplace/app/[locale]/reset-password/page.tsx`
- `marketplace/app/[locale]/profile/page.tsx`
- `marketplace/app/auth/callback/route.ts`

### Jobs/quotes/dashboards
- `marketplace/app/api/jobs/route.ts`
- `marketplace/app/api/jobs/[jobId]/status/route.ts`
- `marketplace/app/api/jobs/[jobId]/accept-quote/route.ts`
- `marketplace/app/api/quotes/route.ts`
- `marketplace/app/[locale]/jobs/page.tsx`
- `marketplace/app/[locale]/providers/page.tsx`
- `marketplace/app/[locale]/dashboard/customer/page.tsx`
- `marketplace/components/dashboard/ProDashboard.tsx`
- `marketplace/components/dashboard/QuoteActions.tsx`

### Messaging/notifications
- `marketplace/app/api/messages/route.ts`
- `marketplace/components/dashboard/JobMessagePanel.tsx`
- `marketplace/components/site/SiteHeader.tsx`

### Payments
- `marketplace/lib/stripe.ts`
- `marketplace/app/api/connect/create-secure-hold/route.ts`
- `marketplace/app/api/connect/finalize-hold/route.ts`
- `marketplace/app/api/connect/capture-payment/route.ts`
- `marketplace/app/checkout/success/page.tsx`
- `marketplace/components/payments/CheckoutSuccessClient.tsx`

### Admin
- `marketplace/app/[locale]/dashboard/admin/page.tsx`
- `marketplace/components/dashboard/AdminApplicationsPanel.tsx`
- `marketplace/components/dashboard/AdminApplicationDetail.tsx`
- `marketplace/app/api/admin/provider-applications/route.ts`
- `marketplace/app/api/admin/verification/run/route.ts`

## 6) Database and Migrations
All schema changes are versioned in `marketplace/migrations`.
Current chain:
- `001` base schema
- `002-013` auth/RLS/storage/RBAC/categories/matching/guest intent foundations
- `014` messaging + profile visibility
- `015` new message notifications
- `016` quote detail extensions + portfolio + KPI
- `017` pro lead actions + commission visibility
- `018` payments RLS
- `019` message retention (auto-delete job messages after 1 year post-completion, cron-ready)
- `020` category slug/name normalization to English (with safe merge logic)
- `021_pro_documents_rls` pro document owner policies (select/insert/delete own docs)
- `021_user_roles_multi_role` true multi-role RBAC (`user_roles` supports multiple rows per user, customer + provider)
- `022` enforce provider submission minimum docs (ID + professional proof)

Rule: add new migrations incrementally; do not rewrite old migrations.

## 6.1) Migration Note (Important)
- There are two `021_*` migrations in repository:
  - `021_pro_documents_rls.sql`
  - `021_user_roles_multi_role.sql`
- Apply both before `022_require_docs_for_provider_submission.sql`.

## 7) Security and Compliance
- RLS enabled across critical tables
- API ownership and role checks enforced server-side
- Zod validation in `marketplace/lib/validation/api.ts`
- Avoid `dangerouslySetInnerHTML`
- Session/cookie flow managed via Supabase SSR clients

## 8) Environment Variables
See `marketplace/.env.example`:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_PLATFORM_BASE_URL`
- `PLATFORM_COMMISSION_RATE`

## 9) Local Commands
- `npm run dev`
- `npm run preflight`
- `npm run health-check`
- `npm run build`

Note: on Windows, `preflight` may print intermittent `UV_HANDLE_CLOSING` assertions; verify against actual query success.

## 10) Payment Flow (Current MVP)
1. Customer accepts a quote (`accept-quote`)
2. Customer starts secure hold (`create-secure-hold` -> Stripe Checkout)
3. Success callback finalizes hold (`finalize-hold`) and stores `payments.status=authorized`
4. Customer marks job `completed`
5. Customer triggers capture (`capture-payment`) and funds are released

## 11) Current Priorities
- Keep UI/content fully English
- Keep Irish location logic strict (county + Eircode)
- Expand verification checklist enforcement
- Add webhook-based Stripe state sync
- Improve guest intent -> account -> publish transition
- Keep message retention cron active (Edge Function `message-retention`)
- Add user notifications for every admin verification decision (`approve`, `reject`, `request_changes`, document-level decisions)
- Future enhancement (not now): send matching email notifications for admin verification decisions
- TODO (pre-prod): integrate new-user welcome email template at `marketplace/docs/email-templates/welcome-new-user.html` and test delivery flow before go-live

## 11.1) Recent Updates (Auth, Verification, Admin)
- OAuth callback stability:
  - middleware bypass for `/auth/callback` added to prevent locale rewrite 404.
- Profile verification UX:
  - inline identity panel on profile page (edit full name/phone, upload required docs, show admin feedback).
  - customer status split into:
    - ID not verified
    - ID uploaded - pending admin approval
    - ID verified
- Access guards:
  - `Get Service` / request-quote flows check identity status and redirect to profile verification when required.
  - header `Become a provider` now routes users without ID to profile verification first.
- Provider onboarding hardening:
  - both `ID` and `professional proof document` required for provider submission.
  - provider onboarding personal fields are editable (full name + phone), with Irish phone validation.
- Admin review upgrades:
  - profile decisions now support `approve`, `reject`, `request_changes`.
  - document-level decisions support `approve`, `reject`, `request_resubmission`.
  - admin UI now shows clearer provider-application context and document checklist.
  - profile approval blocked unless both required docs are verified.
- Data integrity / RLS fixes:
  - `pro_documents` owner RLS policies added.
  - profile address API now auto-ensures profile row before address write (fixes FK errors).

## 12) Handover Instructions for AI Agents
For every feature:
1. Validate Ireland location impact (county/Eircode/matching)
2. Keep all amounts in EUR and cents-safe server logic
3. Add/update RLS + role checks where needed
4. Validate API inputs with Zod
5. Ship with exact file paths changed + migration notes + test steps

## 13) Go-Live Checklist (Ordered)
1. Apply the latest DB migrations up to `020` in order.
2. Apply `021_pro_documents_rls.sql`.
3. Apply `021_user_roles_multi_role.sql` before enabling multi-role UI/guards.
4. Apply `022_require_docs_for_provider_submission.sql`.
5. Verify all category records are English in `public.categories` and linked jobs show English category labels.
6. Configure Stripe live keys and webhook secret; keep test keys out of production env.
7. Enable provider verification enforcement (documents mandatory in production).
8. Deploy Edge Function: `message-retention`.
9. Set Edge Function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
10. Create Vault secrets for cron scheduler:
   - `message_retention_base_url`
   - `message_retention_cron_secret`
11. Confirm `pg_cron`, `pg_net`, and `vault` are enabled in Supabase.
12. Ensure cron job `message-retention-daily` is scheduled and runs successfully.
13. Run a manual retention test call and confirm old completed-job messages are deleted.

## 14) Pricing & Fees Policy (Draft)
Purpose: Keep fee decisions centralized and explicit before production launch. This section is a placeholder and does not define final live pricing yet.

Draft placeholders (to finalize at go-live):
- Customer posting fee: `TBD`
- Booking/deposit model: `TBD`
- Provider/platform commission model: `TBD` (flat or tiered)
- Minimum/maximum transaction rules: `TBD`
- Cancellation/refund fee behavior: `TBD`
- Stripe fee pass-through policy: `TBD`
- VAT/tax handling responsibility: `TBD`
- Rounding and currency rules (EUR/cents): `TBD`

Implementation note:
- Do not hardcode final fee values across UI/API until this section is finalized.
- When finalized, implement via configurable settings (DB/env) and update FAQs/legal pages in one pass.

---
Maintain this file after major feature changes so project context remains transferable.
