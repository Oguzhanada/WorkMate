# WorkMate Project Handover (Full Context)

This file is a full handover for another AI/dev to continue coding safely and consistently.

## 1) Project Identity
- Product: **WorkMate** (Ireland-first service marketplace)
- Repository root: `c:\Users\Ada\Git\Python\Inactive_user_Report`
- App root: `c:\Users\Ada\Git\Python\Inactive_user_Report\marketplace`
- Current architecture: Next.js App Router + Supabase + Stripe Connect

## 2) Tech Stack
- Next.js `16.1.6` (App Router, Turbopack)
- React `19`
- TypeScript
- Supabase
  - Auth
  - Postgres (RLS enabled)
  - Storage
  - Edge Functions
- Stripe (Connect + secure hold/capture flow)
- `next-intl` (English-only active content)
- `zod` for API validation
- `framer-motion` for UI animations
- `lucide-react` icons

## 3) Directory Map (Important)
- `marketplace/app`
  - `app/[locale]/*` main localized pages (`/login`, `/sign-up`, `/profile`, `/post-job`, dashboards)
  - `app/api/*` backend API routes
  - `app/(auth)/*` non-locale auth route variants
- `marketplace/components`
  - `components/auth/*` login/signup/forgot UI blocks
  - `components/forms/*` post-job and onboarding forms
  - `components/profile/*` profile verification + notifications
  - `components/dashboard/*` admin/pro dashboards
- `marketplace/lib`
  - auth/rbac logic
  - validation schemas
  - supabase clients
  - provider document rules/templates
- `marketplace/migrations`
  - SQL migrations in sequence
- `marketplace/supabase/functions`
  - Edge functions (`id-verification-retention`)

## 4) Core Domain Model

### Users / Roles
- `profiles` is the main user profile row (1:1 with `auth.users`)
- `user_roles` supports multi-role (`customer`, `verified_pro`, `admin`) per user
- A user can be customer + provider in same account (multi-role enabled)

### Jobs
- `jobs` created by customers
- `quotes` created by providers for jobs
- `payments` linked to jobs/quotes
- `job_messages` / messages for communication

### Verification
- Identity-first layer in `profiles`:
  - `id_verification_status` (`none|pending|approved|rejected`)
  - related fields for reviewed_at/reason/document url
- Provider docs in `pro_documents` (expanded):
  - `document_type`, `storage_path`, `verification_status`
  - `expires_at`, `coverage_amount_eur`, `cro_number`, `trade_license_code`
  - `rejection_reason`, `metadata`, `archived_at`, `replaced_by_document_id`

### Notifications
- `notifications` table (in-app events)
- `provider_document_notifications` added for document lifecycle-specific notices

## 5) Current Critical Flows

### A) Auth
- Login/Signup/Forgot Password pages redesigned with shared split layout and trust UX
- OAuth (Google/Facebook) enabled from auth pages
- Password reset uses generic safe messaging

### B) Sign Up (Role-based)
- `Customer`: short form + required ID upload
- `Provider`: extended flow + document-type upload and category setup
- Document-type dropdown and per-type validation is implemented in onboarding

### C) Get Service / Post Job
- Multi-step job form with:
  - category/scope/urgency
  - address + budget
  - optional photos
- Eircode now auto-validates (no manual validate button)
- Back/Continue preserves entered values
- After submit, user is redirected to job summary edit page:
  - route: `/post-job/result/[jobId]`
  - editable summary + save updates

### D) Provider Onboarding / Documents
- New `ProOnboardingForm` supports:
  - role mode toggle (`customer|provider`)
  - document type selection
  - per-document metadata fields
  - upload + pre-screen trigger
- Required provider docs:
  - ID
  - Safe Pass
  - Public Liability Insurance (>= 6.5M EUR)
  - Tax Clearance
- Optional:
  - Trade License / Other

### E) Admin Review
- Admin applications panel supports document-level review
- Admin can approve/reject individual docs with notes
- Bulk "approve all required docs" endpoint added
- Document status display includes approved/pending/rejected/expiring marker logic

### F) Provider Dashboard
- Document status cards added (`ProviderDocumentStatusCards`)
- Shows badge-style state per required document
- Not verified providers see onboarding + status cards

## 6) Phone Validation Rule (Unified)
Implemented and unified for profile/signup/provider flow:
- Valid forms accepted:
  - `830446082`
  - `0830446082`
  - `+353830446082` (or spaced variant)
- Valid prefixes only: `83, 85, 86, 87, 89`
- Invalid example now rejected: `+353658245785`
- Normalization persists as `+353XXXXXXXXX`

Main file: `marketplace/lib/validation/phone.ts`

## 7) Storage Buckets and Paths
- Bucket: `pro-documents`
  - ID path pattern: `id-verifications/{userId}/...` and provider-doc paths under `pro-documents/{profileId}/{documentType}/...`
- Bucket: `job-photos`
  - job photo uploads

## 8) API Routes to Know

### Jobs
- `POST /api/jobs` create job
- `GET|PATCH /api/jobs/[jobId]` fetch/update own job summary
- `POST /api/jobs/[jobId]/accept-quote`
- `PATCH /api/jobs/[jobId]/status`
- `POST /api/jobs/[jobId]/photos`

### Admin provider review
- `GET|PATCH /api/admin/provider-applications`
- `GET|PATCH|POST /api/admin/provider-applications/[profileId]/documents`
  - `PATCH`: single document decision
  - `POST`: bulk approve required docs for profile

### Verification
- `POST /api/verification/prescreen`

### Messaging
- `POST /api/messages`

### Address lookup
- `GET /api/address-lookup?eircode=...`

## 9) Migrations State (Important)
Known important chain includes:
- `001` base schema
- `021_pro_documents_rls.sql`
- `021_user_roles_multi_role.sql`
- `022_require_docs_for_provider_submission.sql`
- `027_identity_first_layer.sql`
- `028_id_verification_retention_cron.sql`
- `029_provider_document_workflow.sql` (**latest added for provider docs lifecycle**)

Rule: never rewrite old migrations. Add new numbered migration for each schema change.

## 10) Edge Functions / Retention
- Edge function: `id-verification-retention`
- Cron schedule exists (daily)
- Vault secret + cron secret flow already configured in project work

## 11) UI/UX Conventions
- Trust-first UX language
- Avoid non-English UI text in production-facing content
- Keep consistent palette:
  - primary `#00B894`
  - primary dark `#008B74`
  - accent blue `#0066CC`
- Auth pages: split layout with brand left / form right
- Animations: subtle framer-motion, no over-animation

## 12) Security / Privacy Rules
- Never commit secrets (`.env.local` ignored)
- Service role keys must stay server-only
- Use RLS + server-side ownership checks on write routes
- Keep identity and provider verification as separate layers:
  - `verification_status` (provider/business review)
  - `id_verification_status` (identity review)
- PPS collection should not be used in flows (Ireland privacy/legal direction)

## 13) Environment Variables (Expected)
From `.env.example` + current usage:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_PLATFORM_BASE_URL`
- `PLATFORM_COMMISSION_RATE`
- optional address provider keys (`ADDRESS_PROVIDER`, etc.)

## 14) Local Commands
From `marketplace`:
- `npm run dev`
- `npm run build`
- `npm run preflight`
- `npm run health-check`

## 15) What Was Recently Added (High Impact)
- New auth UI component system + animations
- Role-aware signup and onboarding foundations
- Job submit -> summary result/edit page
- Eircode auto validation in job forms
- Unified strict Irish phone validation
- Provider document lifecycle schema expansion
- Admin bulk document approval endpoint
- Provider document status cards in dashboard

## 16) Known Gaps / Next Recommended Work
1. Connect `ProOnboardingForm` directly into signup provider branch end-to-end (if not yet fully wired in all routes).
2. Add real email delivery integration for provider document notifications using templates in `lib/notifications/provider-documents.ts`.
3. Add periodic job (cron or edge fn) for "expiring soon" provider docs notifications.
4. Expand admin UI detail modal to show all document metadata fields (expiry, CRO, coverage) explicitly.
5. Add stronger tests for:
   - role-based signup branching
   - per-document validation rules
   - archive/reupload flows

## 17) Handover Guidance for New AI
When changing code:
- Respect existing naming and RBAC rules.
- Don’t collapse identity + provider verification into one status.
- Keep migration-only schema evolution.
- Run `npm run build` before finalizing.
- Include file paths changed and user-visible behavior changes in summary.

---
If you need a shorter prompt for another AI, use this file as source-of-truth and ask it to start by validating migrations + auth/role + onboarding + admin document review paths.
