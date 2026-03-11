# WorkMate — Database Operations Runbook

**Project:** WorkMate (Ireland-first services marketplace)
**Database:** Supabase (Postgres) — `ejpnmcxzycxqfdbetydp.supabase.co`
**Migrations:** `marketplace/migrations/` — 001–079 all applied. Next = **080**.

---

## 1. Migration Workflow

### Creating a new migration

1. Determine the next sequence number. As of this writing it is **080**. Check `marketplace/migrations/` for the highest number currently present.
2. Create the file following this naming pattern:

   ```
   marketplace/migrations/080_short_description.sql
   ```

3. Write **additive-only** SQL — `CREATE TABLE`, `ALTER TABLE … ADD COLUMN`, `CREATE INDEX`, `CREATE POLICY`, etc.
4. Never edit, rewrite, or renumber an existing migration file. The history is immutable.

### Applying a migration

Supabase CLI push is **not used** on this project. Apply every migration manually:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select the WorkMate project.
2. Navigate to **SQL Editor**.
3. Paste the full contents of the migration file.
4. Click **Run**.
5. Confirm there are no errors in the output pane.

### Verifying a migration applied

After running, confirm the expected objects exist:

```sql
-- Check a table was created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'your_new_table';

-- Check a column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'your_table'
  AND column_name = 'your_new_column';

-- Check an index was created
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'your_table';
```

### Known migration collision — 021

Two files share the sequence number `021`:

- `021_pro_documents_rls.sql`
- `021_user_roles_multi_role.sql`

Both have been applied. This collision is a known historical artifact and **must not be renumbered or modified**. It is fully resolved — treat 022 as the next sequential number after both 021 files.

---

## 2. Backup Strategy

### Automated backups (Supabase Pro)

Supabase Pro provides daily automated point-in-time backups. No manual intervention is required for the daily cycle.

### Triggering a manual backup

1. Supabase Dashboard → **Project Settings** → **Database** → **Backups**.
2. Click **Create backup** (or equivalent button in the current dashboard UI).
3. The backup will appear in the list once complete.

### Downloading a backup

Navigate to the same location (Project Settings → Database → Backups) and use the download link next to any listed backup.

### Weekly manual export (recommended)

Export the most critical tables weekly using `pg_dump`. Retrieve the database password from `marketplace/.env.local` (`SUPABASE_DB_URL` or `POSTGRES_PASSWORD`).

```bash
pg_dump "postgresql://postgres:[PASSWORD]@db.ejpnmcxzycxqfdbetydp.supabase.co:5432/postgres" \
  --no-owner --no-acl \
  -t jobs -t profiles -t quotes -t reviews -t payments \
  -f backup_$(date +%Y%m%d).sql
```

Store the resulting `.sql` file in a secure, access-controlled location (encrypted cloud storage or similar). Never commit backups to the repository.

---

## 3. Rollback Procedure

Supabase does **not** support automatic migration rollback. Every destructive migration must be accompanied by a manual reversal script.

### Writing a rollback script

For each migration that could cause data loss or structural changes, create a companion file:

```
marketplace/migrations/059_rollback_short_description.sql
```

Common reversal patterns:

```sql
-- Reverse a column addition
ALTER TABLE your_table DROP COLUMN IF EXISTS your_column;

-- Reverse a table creation
DROP TABLE IF EXISTS your_new_table;

-- Reverse an index
DROP INDEX IF EXISTS idx_your_index_name;

-- Reverse a policy
DROP POLICY IF EXISTS "policy_name" ON your_table;

-- Reverse an enum value (Postgres does not support DROP VALUE;
-- you must recreate the enum type without the value)
```

Always test rollback SQL against a staging environment or a local Supabase instance before running it in production.

### Point-in-time recovery (PITR)

PITR is available on the Supabase Pro plan. To initiate a PITR restore, contact Supabase support through the dashboard. Be prepared to specify the exact target timestamp (UTC).

---

## 4. Data Integrity Checks

### Foreign key cascade rules

The schema follows these conventions:

- **User-owned data** (`jobs`, `quotes`, `reviews`, `appointments`, `payments`) — foreign keys to `profiles.id` use `ON DELETE CASCADE`. Deleting a user removes all associated records.
- **Soft references** (e.g., optional associations) — use `ON DELETE SET NULL`.

### Verifying a user deletion cascade

After deleting a user, confirm clean-up:

```sql
-- Replace '[user_id]' with the target UUID
SELECT COUNT(*) FROM jobs    WHERE customer_id = '[user_id]' OR provider_id = '[user_id]';
SELECT COUNT(*) FROM quotes  WHERE provider_id = '[user_id]';
SELECT COUNT(*) FROM reviews WHERE reviewer_id = '[user_id]' OR reviewee_id = '[user_id]';
SELECT COUNT(*) FROM profiles WHERE id = '[user_id]';
```

All counts should be 0 if cascade rules are functioning correctly.

### Unique constraints to be aware of

| Table | Constraint |
|---|---|
| `profiles` | `email` — unique, enforced via Supabase Auth |
| `user_roles` | `(user_id, role)` — unique pair, prevents duplicate role assignments |
| `provider_subscriptions` | One active subscription per provider at a time |

### RLS audit — verify all tables are protected

Run this query to identify any table with row-level security disabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Every table in the `public` schema must show `rowsecurity = true`. Any `false` entry is a security incident — see Section 6.

### Verify policies exist on a specific table

```sql
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'your_table'
ORDER BY policyname;
```

---

## 5. Connection Pool Settings

### Overview

Supabase uses **PgBouncer in transaction mode** as its connection pooler.

| Plan | Default pool size |
|---|---|
| Free | ~15 connections |
| Pro | 25+ connections (configurable) |

### Serverless environments (Vercel / Next.js API routes)

Always use the **pooler URL** (port **6543**), not the direct Postgres URL (port 5432). The direct URL opens a persistent connection per request, which will exhaust the pool under serverless concurrency.

In `marketplace/.env.local`:

```
# Pooler endpoint — use this for all application code
SUPABASE_DB_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres

# Direct endpoint — use only for migrations and pg_dump
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.ejpnmcxzycxqfdbetydp.supabase.co:5432/postgres
```

### Monitoring connections

Supabase Dashboard → **Database** → **Connection Pooling** shows active client count, pool utilisation, and wait queue depth. Check this during load testing and after deploying significant traffic changes.

---

## 6. Emergency Procedures

### RLS accidentally disabled on a production table

**Severity: Critical — act immediately.**

1. Re-enable RLS:

   ```sql
   ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
   ```

2. Confirm policies are still intact:

   ```sql
   SELECT policyname, cmd, roles, qual
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = '[table_name]';
   ```

   If no policies exist, or if the permissive `USING (true)` policy was applied, recreate the correct restrictive policies from the relevant migration file immediately.

3. Run the full RLS audit (Section 4) across all tables to confirm no other table was affected.

4. Review Supabase logs (Dashboard → Logs → Postgres) for any unauthorized reads that occurred during the window.

### Production data accidentally deleted

**Severity: Critical.**

1. **Stop write operations if feasible.** Temporarily disable API keys in Supabase Dashboard → Project Settings → API → disable or rotate the `anon` and `service_role` keys. Update `marketplace/.env.local` and redeploy.

2. Determine the approximate timestamp of the deletion.

3. **If a manual backup covers the period:** restore from the downloaded SQL file into a staging database, identify the missing rows, and re-insert them into production with corrected IDs and timestamps.

4. **If PITR is required:** contact Supabase support via the dashboard and provide the target recovery timestamp (UTC). PITR is only available on Pro plan.

5. After data is restored, re-run any migrations that were applied after the backup timestamp to bring schema and data back in sync.

6. Re-enable API keys and monitor error rates.

### Runaway query locking the database

1. Identify blocking queries:

   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY duration DESC;
   ```

2. Terminate a specific backend:

   ```sql
   SELECT pg_terminate_backend([pid]);
   ```

3. If the issue recurs, review the query via `EXPLAIN ANALYZE` and add appropriate indexes or rewrite the query.
