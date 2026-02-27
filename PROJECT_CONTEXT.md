# WorkMate - AI Context File
> Last updated: 2026-02-27
> Session: 2

## 1. PROJECT IDENTITY
- Name: WorkMate (Ireland service marketplace)
- Stack: Next.js 16 (App Router) + React 19 + TypeScript + Supabase + Stripe
- Repo: `github.com/Oguzhanada/Inactive_user_Report--Python-`
- App folder: `marketplace/`
- Status: Development

## 2. ARCHITECTURE SUMMARY
```text
marketplace/
├── app/
│   ├── [locale]/                  # pages (EN-only content policy)
│   ├── api/                       # route handlers
│   └── auth/callback              # OAuth callback
├── components/
│   ├── auth/ dashboard/ forms/
│   ├── home/ profile/ payments/
│   ├── disputes/ site/ ui/
│   └── jobs/ offers/              # new Airtasker-style UI blocks
├── lib/
│   ├── auth/ validation/ hooks/
│   ├── supabase/                  # browser/server/route/service clients
│   ├── ranking/ pricing/ types/   # new feature layer
│   └── constants/
├── migrations/                    # SQL migrations (001..036)
├── supabase/functions/            # edge functions
└── messages/en.json               # translations
```

## 3. DATABASE SCHEMA (CORE)
- `profiles` (identity + verification + provider priority)
- `user_roles` (customer, verified_pro, admin; multi-role)
- `jobs` (posting flow + approval + identity tier + task mode/type)
- `quotes` (offers + ranking score + expiry)
- `reviews` (rating, public visibility, provider response)
- `pro_documents` (ID + insurance + safe pass + tax clearance workflow)
- `notifications` (in-app, payload JSON)
- `payments` (secure hold / capture / refund lifecycle)
- `disputes`, `dispute_logs`, `dispute_evidence`
- `task_alerts` (new)
- `customer_provider_history` (new)
- `quote_daily_limits` (progressive verification limits)
- `job_intents` (guest flow)
- `provider_rankings` (materialized view, new)

## 4. COMPLETED TASKS
- [x] Identity-first layer + retention cron (`027`, `028`)
- [x] Provider document workflow expansion (`029`)
- [x] Job approval flow (`030`)
- [x] Dispute system (`031`)
- [x] Auto-release payment flow + cron (`032`, `034`)
- [x] Stripe identity base integration (`033`)
- [x] Progressive verification tiers (`035`)
- [x] Airtasker feature layer migration (`036`)
- [x] Offer ranking + fee calculation utilities
- [x] Task alert edge function scaffold (`match-task-alerts`)

## 5. ACTIVE TASK
**Current focus:** Provider onboarding submission failure in `/become-provider`
- Task: Fix category fallback vs UUID mismatch and confirm provider submission path
- Status: In progress
- Last done:
  - Added fallback-aware category hook behavior
  - Added validation to block fallback IDs in provider submit step
  - Improved error surface on provider submit
- Next step:
  - Re-test with user `oguzhanadaa5334@gmail.com`
  - Capture exact DB/API error if still failing
  - Complete RLS smoke checks for `task_alerts`

## 6. PENDING TASKS (PRIORITY)
1. [ ] Finish provider onboarding bug fix verification (UI + DB)
2. [ ] Integrate `OfferCard` into customer quote surfaces
3. [ ] Integrate task alert settings into provider dashboard UI
4. [ ] Deploy `match-task-alerts` function and set function secret
5. [ ] Add provider ranking refresh monitor/health check
6. [ ] Expand automated tests for new ranking/alerts flow

## 7. KNOWN ISSUES
- Provider onboarding can fail when categories API falls back to non-UUID IDs.
- Category source may be unavailable intermittently (fallback warning appears).
- Full RLS smoke test for new `task_alerts` not yet completed.

## 8. IMPORTANT DECISIONS
- English-only policy is mandatory across UI/content/code strings.
- Ireland-first legal/compliance context is mandatory for product decisions.
- Do not add non-Ireland legal terms (for example TIN-only wording); use Ireland-appropriate equivalents.
- Use existing project schema names; avoid copy-paste schema names from external examples.
- Keep security-first posture: RLS + server-side verification gates + minimal broad policies.

## 9. API / ENDPOINT LIST (KEY)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/jobs` | POST | Create job (review + identity tier metadata) |
| `/api/quotes` | POST | Submit quote (limits/visibility/expiry/ranking) |
| `/api/categories` | GET | Category list with fallback behavior |
| `/api/admin/pending-jobs` | GET | Admin review queue |
| `/api/admin/jobs/[jobId]/approve` | PATCH | Approve pending job |
| `/api/admin/jobs/[jobId]/reject` | PATCH | Reject pending job |
| `/api/disputes` | POST | Create dispute |
| `/api/webhooks/stripe` | POST | Stripe webhook handling |
| `/functions/v1/id-verification-retention` | POST | Retention cleanup |
| `/functions/v1/auto-release-payments` | POST | Auto capture flow |
| `/functions/v1/escalate-stale-disputes` | POST | Escalate stale disputes |
| `/functions/v1/match-task-alerts` | POST | Alert matching for new jobs |

## 10. LAST CHANGES (TOP 5)
1. `marketplace/migrations/036_airtasker_feature_layer.sql` - reviews expansion, task alerts, customer-provider history, provider rankings, cron jobs.
2. `marketplace/lib/ranking/offer-ranking.ts` - scoring + provider ranking mapping.
3. `marketplace/lib/pricing/fee-calculator.ts` - rebooking-aware fee logic and history update RPC usage.
4. `marketplace/app/api/jobs/route.ts` & `marketplace/app/api/quotes/route.ts` - task mode/type, quote expiry, ranking update, alert trigger call.
5. `marketplace/app/[locale]/become-provider/page.tsx` & `marketplace/lib/hooks/useCategoriesWithFallback.ts` - fallback handling hardening and clearer submit error details.
