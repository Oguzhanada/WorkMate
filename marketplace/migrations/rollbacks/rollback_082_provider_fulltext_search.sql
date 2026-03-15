-- ============================================================
-- ROLLBACK for Migration 082 — Provider Full-Text Search
-- ============================================================
-- WARNING: This drops the materialized view and all associated
-- indexes. The hourly cron job will start failing after this
-- rollback — unschedule it first.
-- ============================================================

-- 1. Remove the hourly cron refresh
SELECT cron.unschedule('refresh-provider-search');

-- 2. Drop indexes (dropped automatically with MV, but explicit for clarity)
DROP INDEX IF EXISTS idx_provider_search_fullname_trgm;
DROP INDEX IF EXISTS idx_provider_search_vector;
DROP INDEX IF EXISTS idx_provider_search_provider_id;

-- 3. Drop the materialized view
DROP MATERIALIZED VIEW IF EXISTS public.provider_search;
