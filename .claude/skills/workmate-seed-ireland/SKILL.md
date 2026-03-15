---
name: workmate-seed-ireland
description: Use when running seed SQL, adding new seed entries, resetting demo data, or verifying seed output in Supabase.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# WorkMate Ireland Seed Data

Seed data is managed via SQL files executed in the Supabase SQL Editor (service_role context, RLS bypassed).

## Where to Look

- Seed files: `marketplace/scripts/seed-categories.sql`, `marketplace/scripts/seed-test-data.sql`, `marketplace/scripts/seed-scenarios.sql`
- Shared guardrails: `.claude/skills/references/workmate-shared-guardrails.md`

## Seed Files

| File | Purpose | Run order |
|------|---------|-----------|
| `marketplace/scripts/seed-categories.sql` | Parent categories + subcategories | 1 (run first) |
| `marketplace/scripts/seed-test-data.sql` | Auth users, profiles, jobs, quotes, reviews | 2 |
| `marketplace/scripts/seed-scenarios.sql` | Pro documents, disputes, messages, notifications, referrals | 3 (depends on seed-test-data IDs) |

> The legacy `scripts/seed-ireland.mjs` at the repo root is deprecated. Use the SQL files above.

## Demo Accounts

Demo accounts: read `marketplace/scripts/seed-test-data.sql` header for current account structure and counts. Account IDs: see `seed-test-data.sql` for current ID assignment scheme.

## Procedure

### Run the Seed

Execute each SQL file in order in the Supabase SQL Editor. Each file is re-runnable: cleanup sections at the top delete previous seed data by ID prefix before re-inserting.

### Clean Up Before Re-Seeding

> **WARNING: DEV ONLY** — never run cleanup SQL on a production database.

```sql
-- Remove all test users by ID prefix (cascade deletes child records)
DELETE FROM auth.users WHERE id::text LIKE 'a1000000%'
                          OR id::text LIKE 'a2000000%'
                          OR id::text LIKE 'a3000000%';
```

### Add New Seed Entries

Edit the appropriate SQL file and follow the existing INSERT pattern. Use deterministic UUIDs within the established ID ranges.

### Post-Seed Verification

1. Check `profiles` table — seed accounts visible.
2. Check `user_roles` table — `verified_pro` role assigned to providers.
3. Check `jobs` table — open and completed jobs present.
4. Log in with a demo account at `localhost:3000/en/login`.
5. Verify featured providers appear on homepage (requires `is_verified: true`).
6. Verify supplemental data in respective tables (pro documents, disputes, messages, notifications).

## Rules — Ireland-First Data

- **Phone**: always `+353XXXXXXXXX` — valid prefixes: 83, 85, 86, 87, 89.
- **Eircode**: format `X00 XXXX` (routing key + unique identifier). Examples: Dublin `D01`, Cork `T12`. See seed files for full list.
- **County**: one of Ireland's 26 counties (not UK counties).
- **Money**: always in cents — €50 = `5000`.
- **Email**: use `@workmate-demo.ie` domain for all seed accounts.

## NEVER DO

- Never run cleanup SQL on a production database.
- Never use UK counties, postcodes, or phone formats in seed data.
- Never create seed accounts outside the established ID prefix ranges.
