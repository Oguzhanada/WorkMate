-- ============================================================
-- ROLLBACK for Migration 083 — Idempotency Keys
-- ============================================================
-- WARNING: Active idempotency keys will be lost. In-flight
-- deduplicated requests may be processed again.
-- ============================================================

-- 1. Remove the daily cleanup cron
SELECT cron.unschedule('cleanup-idempotency-keys');

-- 2. Drop RLS policies
DROP POLICY IF EXISTS "Users can read own idempotency keys" ON public.idempotency_keys;
DROP POLICY IF EXISTS "Service role manages idempotency keys" ON public.idempotency_keys;
DROP POLICY IF EXISTS "Admins can read all idempotency keys" ON public.idempotency_keys;

-- 3. Drop table (cascades indexes and constraint)
DROP TABLE IF EXISTS public.idempotency_keys;
