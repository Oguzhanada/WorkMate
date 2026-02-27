# WorkMate (Ada Marketplace) - AI Context File
> Last updated: 2026-02-27
> Session: 3

---

## 1. PROJECT IDENTITY

| Field | Value |
|------|-------|
| Name | WorkMate (code name: Ada Marketplace) |
| Description | Ireland-focused services marketplace |
| Repo | `github.com/Oguzhanada/Inactive_user_Report--Python-` |
| Main folder | `marketplace/` |
| Status | Development |
| Target market | Ireland (26 counties, Eircode) |
| Product language | English-only (UI, docs, errors, policy pages) |

---

## 2. TECH STACK

- Frontend: Next.js 16.1.6 (App Router, Turbopack), React 19, TypeScript
- Backend: Next.js API routes + Supabase Edge Functions
- Database: Supabase PostgreSQL with RLS
- Auth: Supabase Auth (Email/Password + Google/Facebook OAuth)
- Payments: Stripe Connect (secure hold → capture/refund)
- Styling/UI: Tailwind CSS, CSS modules, shadcn/ui primitives, Framer Motion
- Validation: Zod + custom Ireland validators (Eircode, phone, name)
- i18n: next-intl infrastructure, English content only

---

## 3. ARCHITECTURE SUMMARY

```text
marketplace/
├── app/
│   ├── [locale]/                    # routed pages
│   ├── api/                         # server endpoints
│   ├── auth/callback/route.ts       # OAuth callback
│   └── layout.tsx / globals.css
├── components/
│   ├── auth/ dashboard/ disputes/
│   ├── forms/ home/ payments/ profile/
│   ├── site/ ui/
│   ├── jobs/                        # Hybrid job mode selector
│   └── offers/                      # Offer card UI
├── lib/
│   ├── auth/                        # RBAC helpers
│   ├── supabase/                    # browser/server/route/service clients
│   ├── validation/                  # Zod + custom validators
│   ├── ranking/ pricing/ types/     # Airtasker-style feature layer
│   └── constants/ hooks/
├── migrations/                      # 001..036
├── supabase/functions/              # edge functions
└── messages/en.json
```

---

## 4. DATABASE SCHEMA

### Core tables
- `profiles`, `user_roles`
- `jobs`, `quotes`, `reviews`
- `pro_documents`, `pro_services`, `pro_service_areas`
- `notifications`, `payments`, `job_messages`
- `categories`, `addresses`, `job_intents`
- `disputes`, `dispute_logs`, `dispute_evidence`

### New/extended feature tables
- `task_alerts`
- `customer_provider_history`
- `quote_daily_limits`
- Materialized view: `provider_rankings`

### Verification states (active model)
- `profiles.id_verification_status`: `none | pending | approved | rejected`
- `profiles.verification_status`: provider workflow status layer
- `pro_documents.verification_status`: `pending | verified | rejected | request_resubmission`

---

## 5. COMPLETED FEATURES

- [x] Auth system (login/signup/OAuth/reset)
- [x] Multi-role RBAC (customer + provider + admin)
- [x] Job posting flow (guest + authenticated)
- [x] Provider onboarding and document upload
- [x] Admin review panel (job approval + provider docs)
- [x] Stripe secure hold flow + capture + webhook route
- [x] Disputes and payment release escalation base
- [x] Progressive verification tiers (`035`)
- [x] Airtasker-style feature foundation (`036`)
  - quote expiry + ranking score columns
  - task alerts table + RLS
  - customer/provider history + RPC increment
  - provider rankings materialized view + refresh function

---

## 6. ACTIVE TASK

**Current task:** Provider onboarding consistency after verified ID.

- Task name: Prevent redundant ID request when user is already ID-verified.
- Status: In progress (code fix pushed, verification pending).
- Last completed:
  - Reused approved identity state in `become-provider` flow.
  - Avoided accidental downgrade from approved to pending.
  - Improved fallback-category behavior and error details.
- Next step:
  - Re-test onboarding for `oguzhanadaa5334@gmail.com`.
  - Run RLS smoke test for `task_alerts`.
  - Integrate `OfferCard` and task alerts UI into active dashboards.

---

## 7. PENDING TASKS (PRIORITY ORDER)

1. [ ] Verify provider onboarding final behavior end-to-end.
2. [ ] Add task alerts UI in provider dashboard.
3. [ ] Integrate offer ranking badges into customer quote list.
4. [ ] Deploy `match-task-alerts` edge function and set required secret.
5. [ ] Add monitoring/health check for `provider_rankings` refresh.
6. [ ] Expand tests for ranking, task alerts, and onboarding regressions.

---

## 8. KNOWN ISSUES

- Category API fallback can block provider submission if DB categories are unavailable.
- Provider onboarding had redundant ID path; patched but requires UI verification pass.
- `task_alerts` RLS still needs explicit smoke-test confirmation in DB session.

---

## 9. IMPORTANT DECISIONS

- Ireland-only product/legal context is mandatory.
- English-only content is mandatory across product and docs.
- Use existing schema names and enums; do not copy external schema names blindly.
- Keep RLS strict and scoped (no open `FOR ALL USING (true)` patterns).
- Do not use competitor-negative language in public pages; use neutral product positioning.

---

## 10. API / ENDPOINT LIST (KEY)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs` | POST | Create job with review + tier metadata |
| `/api/quotes` | POST | Submit quote with limits/expiry/ranking |
| `/api/categories` | GET | Categories with fallback |
| `/api/admin/pending-jobs` | GET | Admin queue |
| `/api/admin/jobs/[jobId]/approve` | PATCH | Approve job |
| `/api/admin/jobs/[jobId]/reject` | PATCH | Reject job |
| `/api/disputes` | POST | Create dispute |
| `/api/webhooks/stripe` | POST | Stripe events |
| `/functions/v1/id-verification-retention` | POST | ID retention cleanup |
| `/functions/v1/auto-release-payments` | POST | Auto payment release |
| `/functions/v1/escalate-stale-disputes` | POST | Escalate stale disputes |
| `/functions/v1/match-task-alerts` | POST | Match jobs to task alerts |

---

## 11. IRELAND COMPLIANCE BASELINE

- Provider docs: ID, Public Liability Insurance, Safe Pass, Tax Clearance (where applicable).
- Eircode validation enforced in posting flows.
- Irish phone validation enforced in onboarding/profile.
- No forced PPSN collection in baseline app flow.

---

## 12. WORKING PROTOCOL

- Context health statuses:
  - `OK`
  - `High usage`
  - `Save checkpoint now`
- Create checkpoint when:
  - a major feature block is completed,
  - context usage is high,
  - user asks for checkpoint.
- Day summary generated only when user asks (`"day finished"`).

---

## 13. REFERENCE LINKS

- Repo: `https://github.com/Oguzhanada/Inactive_user_Report--Python-`
- Supabase docs: `https://supabase.com/docs`
- Stripe Connect docs: `https://stripe.com/docs/connect`
- Next.js docs: `https://nextjs.org/docs`
- Eircode: `https://www.eircode.ie`

---

## 14. LAST CHANGES (TOP 5)

1. `marketplace/migrations/036_airtasker_feature_layer.sql` added and applied.
2. `marketplace/lib/types/airtasker.ts`, `marketplace/lib/ranking/offer-ranking.ts`, `marketplace/lib/pricing/fee-calculator.ts` added.
3. `marketplace/app/api/jobs/route.ts`, `marketplace/app/api/quotes/route.ts` extended (mode/type/expiry/ranking/alert trigger).
4. `marketplace/app/[locale]/become-provider/page.tsx` fixed to reuse approved ID state.
5. `PROJECT_CONTEXT.md` standardized and updated for session continuity.
