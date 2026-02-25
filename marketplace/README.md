# WorkMate  (Next.js + Supabase + Stripe Connect)

## Suggested Next.js folder structure

```text
marketplace/
├─ app/
│  ├─ (auth)/onboarding/pro/page.tsx
│  ├─ api/
│  │  ├─ address-lookup/route.ts
│  │  ├─ jobs/route.ts
│  │  ├─ quotes/route.ts
│  │  └─ connect/
│  │     ├─ create-account-link/route.ts
│  │     ├─ create-secure-hold/route.ts
│  │     └─ capture-payment/route.ts
│  ├─ checkout/
│  │  ├─ success/page.tsx
│  │  └─ cancel/page.tsx
│  ├─ dashboard/pro/page.tsx
│  └─ post-job/page.tsx
├─ components/
│  ├─ dashboard/ProDashboard.tsx
│  ├─ forms/EircodeAddressForm.tsx
│  ├─ forms/JobMultiStepForm.tsx
│  ├─ forms/ProOnboardingForm.tsx
│  └─ payments/SecureHoldButton.tsx
├─ lib/
│  ├─ eircode.ts
│  ├─ stripe.ts
│  └─ supabase.ts
├─ docs/ie_compliance_architecture.json
└─ migrations/001_initial_marketplace_schema.sql
```

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADDRESS_PROVIDER=ideal_postcodes # or loqate
IDEAL_POSTCODES_API_KEY=YOUR_IDEAL_POSTCODES_KEY
LOQATE_API_KEY=YOUR_LOQATE_KEY
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
NEXT_PUBLIC_PLATFORM_BASE_URL=http://localhost:3000
```

Security note:
- Never commit `.env.local`, service keys, bearer tokens, or private webhook secrets.
- If any secret is ever shared in chat/screenshots, rotate it immediately.

Development recommendation:
- Use `ADDRESS_PROVIDER=none` to validate only Eircode format and collect county/city from dropdown lists.
- Enable paid geocoding providers later in production when needed.

## Notes
- Eircode is validated with Irish-specific regex and normalized to uppercase.
- Verified Pros are enforced at DB trigger level before quote creation.
- Stripe flow uses `capture_method=manual` for secure hold and captures on completion.
- Commission is configurable via `PLATFORM_COMMISSION_RATE` (default `0` for launch/test mode).
