-- ──────────────────────────────────────────────────────────────────────────────
-- Migration 080: provider_rankings hourly refresh
--
-- Problem: provider_rankings materialized view was only refreshed nightly (migration 040).
-- This means new completed jobs, new reviews, and new compliance scores are not
-- reflected in provider search results until the next day.
--
-- Solution: Add an hourly pg_cron job alongside the existing nightly job.
-- The nightly job is kept as-is (full refresh at midnight).
-- The hourly job runs a lighter REFRESH MATERIALIZED VIEW CONCURRENTLY.
--
-- Both jobs are additive — they do not delete or replace each other.
-- CONCURRENTLY means active reads are never blocked.
-- ──────────────────────────────────────────────────────────────────────────────

-- Ensure pg_cron extension is available (should already be enabled from migration 040)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Hourly refresh (every hour, on the hour) ──────────────────────────────────
SELECT cron.schedule(
  'refresh-provider-rankings-hourly',   -- job name (unique)
  '0 * * * *',                          -- every hour at :00
  $$
    SELECT public.refresh_provider_rankings_safe();
  $$
);

-- ── Verify both cron jobs exist ───────────────────────────────────────────────
-- After applying this migration, confirm with:
--   SELECT jobname, schedule, command, active FROM cron.job ORDER BY jobname;
--
-- Expected output:
--   refresh-provider-rankings          | 0 0 * * * | SELECT public.refresh_... | true  (nightly, from mig 040)
--   refresh-provider-rankings-hourly   | 0 * * * * | SELECT public.refresh_... | true  (hourly, from this mig)
