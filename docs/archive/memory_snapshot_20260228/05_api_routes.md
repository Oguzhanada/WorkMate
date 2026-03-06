---
VERSION: 1.0
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Initial API route inventory added
- Added edge function mapping and critical endpoints
---

# API Routes

## Current API Surface

- Approximate route handler count: 41 (`marketplace/app/api/**/route.ts`).
- Domain coverage: auth/account, jobs/quotes, admin review, disputes, profile, Stripe, webhooks.

## Critical Route Groups

- Jobs and quotes:
  - `POST /api/jobs`
  - `POST /api/quotes`
  - `PATCH /api/jobs/[jobId]/status`
  - `POST /api/jobs/[jobId]/accept-quote`
- Admin reviews:
  - `GET/PATCH /api/admin/provider-applications`
  - `PATCH/POST /api/admin/provider-applications/[profileId]/documents`
  - `PATCH /api/admin/jobs/[jobId]/approve`
  - `PATCH /api/admin/jobs/[jobId]/reject`
- Payments:
  - `POST /api/connect/create-secure-hold`
  - `POST /api/connect/finalize-hold`
  - `POST /api/connect/capture-payment`
  - `POST /api/webhooks/stripe`
- Disputes:
  - `POST /api/disputes`
  - `POST /api/disputes/[id]/respond`
  - `POST /api/disputes/[id]/resolve`
  - `POST /api/disputes/[id]/process-payment`

## Edge Functions (Supabase)

- `match-task-alerts`
- `auto-release-payments`
- `escalate-stale-disputes`
- `id-verification-retention`
- `message-retention`

## Validation

- Request contracts are centralized in `lib/validation/api.ts` via Zod schemas.

