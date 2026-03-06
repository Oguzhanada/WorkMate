---
VERSION: 1.0
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Initial checkpoint log created
- Added current state snapshot from active workspace
- Added checkpoint for Stripe Identity direction and admin/profile/post-job QA fixes
---

# Checkpoints

## 2026-02-28 - Stripe Identity Direction and Admin/Profile/Post-Job Stabilization

- Confirmed product direction: primary ID verification path will be Stripe Identity.
- Agreed default model: avoid storing user ID document files in WorkMate when Stripe Identity is used.
- Applied admin dashboard reliability fixes:
  - status/filter defaults corrected
  - search expanded (name/phone/email/id)
  - status badge click-to-filter
  - refresh action and live stats endpoint
- Applied profile UX updates:
  - customer identity line simplified to short verified-identity benefits text
  - provider ID remains required; additional provider documents are optional trust/matching boosts
- Applied post-job robustness updates:
  - removed front-end eircode validation gate dependency
  - improved validation-failure surfacing and fallback-category guards
- Validation performed:
  - `npm run lint` passed after each change set

## 2026-02-28 - Memory Baseline Established

- Created `docs/memory/` multi-file documentation system.
- Added structured files for architecture, schema, APIs, UI, and business rules.
- Added decision log and execution index with update cadence.

## 2026-02-27 - Admin Dashboard Live Integration (v2 Snapshot)

- Localized admin dashboard wired to live APIs.
- Provider document endpoints return signed open/download URLs.
- Admin application UI includes open/download controls and decision flows.
- Lint/type gate reported passing during that checkpoint session.

## 2026-02-27 - Provider Onboarding Verification Consistency

- Introduced onboarding verification resolver to prevent verified ID regression.
- Added unit tests for verification state transitions.
- Remaining validation recommended with live/seeded end-to-end checks.

## 2026-03-05 - UI Architecture Rollout (Premium Minimal)

- Added centralized shared UI layer (`Button`, `Card`, `Badge`, `StatCard`, `Shell`).
- Updated global tokens and dark-mode-ready surface palette in `app/globals.css`.
- Migrated phase-1 pages (`dashboard/customer`, `dashboard/pro`, `providers`, `post-job`) to shared UI primitives.
- Added architecture doc (`marketplace/docs/ui-architecture.md`) and guardrail (`No new raw CSS`) to `marketplace/AGENTS.md`.
- Created checkpoint file: `docs/CHECKPOINT_UI_ARCHITECTURE_2026-03-05.md`.

## 2026-03-05 - Public API/Webhooks + Time Tracking/Invoicing

- Completed Prompt 5 public integration layer:
  - Public API routes under `/api/public/v1/*` (jobs, providers, webhook subscribe/delete).
  - Profile/admin API key management routes and admin/profile UI panels.
  - Webhook event wiring (`job.created`, `quote.accepted`) with retry behavior.
  - Public API documentation added at `marketplace/docs/api/public-v1.md`.
- Completed Prompt 6 hourly operations layer:
  - Added migration `047_time_tracking_and_invoicing.sql` (`time_entries`, strict RLS, invoice metadata on jobs).
  - Added time-entry APIs (GET/POST/PATCH/DELETE) and invoice creation endpoint.
  - Added `TimeTracking` widget to job detail page.
  - Added Stripe invoice paid webhook handling and `payment.completed` webhook emission.
- Validation:
  - `npm run lint` passed.
  - `npx tsc --noEmit` passed.
  - API-only smoke flow passed via `marketplace/scripts/test-time-tracking-api-flow.mjs`.
