# WorkMate — Checkpoint Session 13
Date: 2026-03-06
Topic: Strategic Roadmap — Merged Action Plan (Prompt 1 base + Prompt 2 best additions)

---

## Decision: Prompt 1 Chosen as Base

**Why Prompt 1:** Codebase-grounded, references real migration numbers/components, solo-developer realistic, weaponizes already-built advantages.

**Why Prompt 2 was rejected as base:** Generic marketplace advice, recommends things already built (messaging, scheduling, webhooks), wrong scale for current team (design agencies, ELK stack, penetration testing retainers).

**What was kept from Prompt 2:** KPI success metrics, price estimation tool, fraud/anomaly detection, A/B test infrastructure, Garda vetting, contract templates, GDPR automation, tax reporting tool, UK expansion horizon.

---

## Core Competitive Weapons (Already Built — Must Be Marketed)

These 3 exist in no competitor. They are the marketing foundation:

1. **Irish Compliance Stack** — SafePass + €6.5M Insurance + Tax Clearance + Admin approval + Eircode
2. **Stripe Secure Hold** — money held until job complete, then released. No competitor does this in Ireland.
3. **Hybrid Job Model** — Quick Hire + Direct Request + Get Quotes. Airtasker only has one mode.

---

## PHASE 1 — Quick Wins (1–2 Weeks)

### 1. Irish Compliance Badge System
- "Ireland Fully Verified" badge on every provider profile
- Filter toggle on /providers: "Only Verified Irish Pros" (default ON)
- Admin panel: `compliance_score` (0–100) = weighted sum of: id_verified + insurance + tax_clearance + SafePass + admin_approved
- **Migration 050:** `compliance_score` column on `profiles`, auto-computed view update

### 2. Smart Match Score
- Formula: `ranking_score × compliance_score × response_time_factor`
- Server action computes on quote retrieval
- Shown on customer quote list as "Match %" badge

### 3. Rebooking Loyalty — 1.9% Fee
- If `customer_provider_history` has >= 1 completed job between same pair → fee drops to 1.9%
- "Rebook [Provider Name]?" CTA on customer dashboard
- "You saved €XX with loyal rate!" message on checkout
- Badge on provider profile: "Returning customer discount"
- **Uses existing table:** `customer_provider_history` (migration 036)

### 4. "Why WorkMate?" Homepage Section
- 3 competitor comparison cards: WorkMate vs Airtasker IE vs MyBuilder
- Highlight: Irish Compliance + Secure Hold + Hybrid Model
- Trust numbers: "100% verified providers", "Secure payment held until done", "3 job modes"

### 5. Provider "AI Suggested Alerts"
- Button on TaskAlertsPanel: "Suggest alerts based on my services"
- Reads provider's `pro_services` categories → auto-creates task_alerts for matching job types
- Server action: `suggestAlertsForProvider(providerId)`

### 6. Offer Ranking Badge Polish
- TOP OFFER amber badge already exists — confirm Framer Motion spring animation is active
- Add: expiry countdown (48h) on quote cards
- Add: "X providers viewed this job" counter

---

## PHASE 2 — Differentiation (3–6 Weeks)

### 7. Price Estimation Tool (FROM PROMPT 2)
- Before customer submits a job: "Similar jobs in Dublin cost €80–€140"
- Query: `SELECT percentile_cont(0.25), percentile_cont(0.75) FROM quotes WHERE category_id = ? AND status = 'accepted'`
- Show as a subtle range hint in `JobMultiStepForm` step 2
- Benefit: sets realistic expectations, reduces abandoned jobs

### 8. Multi-Dimension Review System
- Current: single star rating
- New: 3 dimensions — Quality, Punctuality, Value for Money (each 1–5)
- Optional photo upload on review
- Provider profile shows radar-style score breakdown
- **Migration 051:** `review_dimensions` JSONB column on `reviews`

### 9. "Same-Day Guarantee" Badge
- If provider has availability slots within 24h of now → show "Available Today" badge
- Query against `provider_availability_slots` (migration 048)
- Shown on /providers list and on quote card

### 10. Provider Earnings Dashboard
- Widget: "This month: €XXX earned, €XX platform fee, €XX net"
- Payout estimate: "Expected payout: [date]"
- Breakdown by job with status

### 11. Customer "Favourite Pros" List
- Heart icon on provider profile → saves to `favourite_providers` table
- Dashboard widget: "Your saved pros" with quick-rebook CTA
- **Migration 052:** `favourite_providers (customer_id, provider_id, created_at)`

### 12. AI Job Description Writer
- Input: category + 3 keywords → output: full job description
- Powered by Claude API (claude-haiku-4-5 for cost efficiency)
- Button in `JobMultiStepForm` step 1: "Help me write this"

### 13. Remote / Virtual Consultation Mode
- New job type: `remote` (alongside `on_site`)
- Providers can offer "Video Consultation (30 min)" as a bookable service
- Integrates with `job_appointments` via video_link field
- **Migration 053:** `job_type` enum add `remote`, `video_link` on `job_appointments`

### 14. Fraud / Anomaly Detection (FROM PROMPT 2)
- Admin panel: risk score per profile (0–100)
- Flags: same IP multiple accounts, no-review chargebacks, account age < 24h posting jobs
- Server-side check on job POST and quote POST
- **Migration 054:** `risk_score` + `risk_flags JSONB` on `profiles`

---

## PHASE 3 — Market Leadership (6–12 Months)

### 15. Mobile App (React Native + Expo)
- Shared API already exists (public/v1 + internal)
- Push notifications via Expo + Supabase Realtime
- Priority screens: browse jobs, quote flow, messaging, dashboard

### 16. Garda Vetting Integration (FROM PROMPT 2)
- Ireland: providers for in-home services (childcare, elderly care) require Garda vetting
- API: vetting.ie or manual upload + admin verification
- New verification tier: `garda_vetted` badge (above standard verification)
- **Migration 055:** `garda_vetting_status` on `profiles`

### 17. Revenue.ie Tax Clearance API
- Auto-check provider's Tax Clearance Certificate via Revenue API
- Currently: manual document upload. Automate the verification.
- Triggers on provider application submission

### 18. Provider Tax Reporting Tool (FROM PROMPT 2)
- Annual earnings summary PDF: total income, platform fees, net — ready for Revenue declaration
- Download from provider dashboard: "Download 2026 Tax Summary"
- Purely a query + PDF generation, no Revenue API needed for this

### 19. Contract Templates
- Per-category standard contract (Electrical: liability clause, Cleaning: access terms, etc.)
- Auto-generated PDF on quote acceptance
- Customer and provider both get signed copy via email
- **Migration 056:** `job_contracts` table

### 20. GDPR Automation (FROM PROMPT 2)
- Auto-delete inactive accounts after 5 years (pg_cron)
- User data export endpoint: GET /api/account/export → JSON of all user data
- Right-to-erasure: DELETE /api/account/delete (already partially exists)
- Cookie consent audit (banner already exists — ensure preferences are respected)

### 21. A/B Test Infrastructure (FROM PROMPT 2)
- Feature flag table: `feature_flags (name, enabled, rollout_percentage, user_segment)`
- Middleware reads flags and injects into layout
- First test: onboarding flow variant A (current 3-step) vs B (single page)
- **Migration 057:** `feature_flags` table

### 22. White-Label / UK Expansion
- next-intl already supports multiple locales — add `en-GB`
- UK postcodes validator (replace Eircode)
- Stripe Connect already works in UK
- Brand stays WorkMate, domain: workmate.co.uk

### 23. "WorkMate Pro" Provider Subscription
- Monthly: €29/month → unlimited leads, featured placement, priority badge
- Annual: €249/year
- Replaces per-lead cost model (kills MyBuilder's hated model)
- **Migration 058:** `provider_subscriptions` table + Stripe subscription integration

### 24. Community & Trust (FROM PROMPT 2)
- "Best Provider of the Year" annual awards (voted by customers)
- Provider leaderboard by county (monthly reset)
- Referral program: "Refer a pro, earn €20 credit"

---

## KPI Targets (FROM PROMPT 2 — Kept for Planning)

| Metric | 3 months | 6 months | 12 months |
|---|---|---|---|
| Monthly Active Users | 500 | 2,500 | 10,000 |
| Jobs posted/month | 50 | 300 | 1,000 |
| Provider avg jobs/month | 2 | 4 | 6 |
| Customer NPS | 30+ | 40+ | 50+ |
| Repeat booking rate | 15% | 30% | 45% |
| Visitor → job post conversion | 2% | 4% | 6% |

---

## Migration Sequence (Reserved Numbers)

| Migration | Purpose |
|---|---|
| 050 | `compliance_score` on profiles + updated ranking view |
| 051 | `review_dimensions` JSONB on reviews |
| 052 | `favourite_providers` table |
| 053 | `job_type` enum + `video_link` on job_appointments |
| 054 | `risk_score` + `risk_flags` on profiles |
| 055 | `garda_vetting_status` on profiles |
| 056 | `job_contracts` table |
| 057 | `feature_flags` table |
| 058 | `provider_subscriptions` table |

---

## What NOT to Do (Guard Rails)

- Do NOT switch to lead-gen model (MyBuilder's fatal mistake — providers hate it)
- Do NOT loosen compliance requirements (one cowboy scandal = brand death)
- Do NOT raise fees before reaching 1,000 monthly active users
- Do NOT expand beyond Dublin/Cork/Galway before each city has 20+ verified providers
- Do NOT add English language variants (English-only, always)
- Do NOT recreate `lib/supabase.ts` singleton

---

## State at End of Session 13

- Codebase: clean, migrations 001–049 all applied
- Next migration: **050** (compliance_score)
- Strategic roadmap: locked
- Phase 1 items ready to build, starting with Migration 050 + Compliance Badge
