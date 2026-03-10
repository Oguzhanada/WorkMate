---
name: workmate-seed-ireland
description: WorkMate Ireland seed data management. Use when running the seed script, adding new seed entries, resetting demo data, or verifying seed output in Supabase. Covers demo accounts, data patterns, and post-seed validation steps.
---

# WorkMate Ireland Seed Data

Script location: `scripts/seed-ireland.mjs`
Run from repo root: `node scripts/seed-ireland.mjs`

## Demo Accounts (created by seed)

All accounts use password: **`WorkMate2026!`**

### Providers (8 accounts)
Irish-realistic names, verified_pro role, `is_verified: true`, Dublin/Cork/Galway counties, valid Eircodes, pro_services populated.

### Customers (5 accounts)
Standard customer role accounts with realistic Irish names and addresses.

### Jobs (6 open)
Mix of `get_quotes` and `quick_hire` modes, various services, valid Eircodes, open status.

### Reviews
Provider reviews with realistic ratings and Irish-context comments.

## Running the Seed

```bash
# From repo root
node scripts/seed-ireland.mjs

# Script reads .env.local for Supabase credentials
# Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
# Idempotent — can re-run, but creates duplicates if emails not cleaned first
```

## Before Re-Seeding (clean up first)

In Supabase SQL Editor:
```sql
-- Remove seed users by email pattern
DELETE FROM auth.users WHERE email LIKE '%@workmate-demo.ie';
-- OR delete specific profiles first (cascade handles auth.users)
DELETE FROM profiles WHERE email LIKE '%@workmate-demo.ie';
```

## Adding New Seed Entries

Open `scripts/seed-ireland.mjs` and follow the existing pattern:

```javascript
// Provider pattern
{
  email: 'newprovider@workmate-demo.ie',
  password: 'WorkMate2026!',
  profile: {
    full_name: 'Seán Murphy',
    phone: '+353861234567',       // must be +353 + valid prefix (83/85/86/87/89)
    county: 'Dublin',
    eircode: 'D02 X285',          // must be valid Eircode format
    role: 'verified_pro',
    is_verified: true,
    verification_status: 'approved',
    id_verification_status: 'verified',
    bio: '...',
    hourly_rate_cents: 5000,       // money in cents — €50.00/hr
  },
  services: ['plumbing', 'heating'], // from service_taxonomy
}
```

## Ireland-First Data Rules

- **Phone**: always `+353XXXXXXXXX` — valid prefixes: 83, 85, 86, 87, 89
- **Eircode**: format `X00 XXXX` (routing key + unique identifier)
- **County**: one of Ireland's 26 counties (not UK counties)
- **Money**: always in cents — €50 = `5000`
- **Email**: use `@workmate-demo.ie` domain for all seed accounts

## Valid Eircode Examples by County

```
Dublin:   D01, D02, D04, D06, D08, D12, D14, D18, D22, D24
Cork:     T12, T23
Galway:   H91
Limerick: V94
Waterford: X91
```

## Post-Seed Verification

1. Check Supabase → Table Editor → `profiles` — seed accounts visible
2. Check `user_roles` table — `verified_pro` role assigned to providers
3. Check `jobs` table — 6 open jobs present
4. Log in with a demo account at `localhost:3000/en/login`
5. Check featured providers appear on homepage (requires `is_verified: true`)

## Script Internals

- Uses `@supabase/supabase-js` ESM import (no `require`)
- Creates auth users via `supabase.auth.admin.createUser()`
- Inserts profiles directly to bypass triggers
- Sets `user_roles` entries after profile creation
- Commits reviews after both reviewer and reviewee profiles exist
