# Message Retention (1 Year) - Supabase Edge Function + Cron

This setup deletes rows from `public.job_messages` for jobs that were completed more than 1 year ago.

## 1) Deploy the Edge Function

```bash
supabase functions deploy message-retention --no-verify-jwt
```

Set function secrets:

```bash
supabase secrets set SUPABASE_URL=https://<PROJECT_REF>.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
supabase secrets set CRON_SECRET=<LONG_RANDOM_SECRET>
```

## 2) Add Vault secrets for DB cron scheduler

Run in Supabase SQL editor:

```sql
select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'message_retention_base_url');
select vault.create_secret('<LONG_RANDOM_SECRET>', 'message_retention_cron_secret');
```

## 3) Run migration

Apply:

- `migrations/019_message_retention_cron.sql`

This migration:
- backfills `jobs.complete_marked_at` if missing,
- keeps `complete_marked_at` synced on job status changes,
- schedules `message-retention-daily` at `03:15` daily (server time), if required extensions/secrets exist.

## 4) Manual test

```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/message-retention" \
  -H "Authorization: Bearer <LONG_RANDOM_SECRET>" \
  -H "Content-Type: application/json" \
  -d "{}"
```

Expected JSON:

```json
{
  "ok": true,
  "deleted_messages": 12,
  "scanned_completed_jobs": 5,
  "threshold": "2025-02-23T00:00:00.000Z"
}
```
