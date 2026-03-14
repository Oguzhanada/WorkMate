-- ============================================================
-- ROLLBACK for Migration 084 — Payment Events (Audit Trail)
-- ============================================================
-- WARNING: All payment audit trail data will be permanently lost.
-- Must also drop the trigger from 086 first if it was applied.
-- ============================================================

-- 1. Drop the automatic audit trigger (from migration 086)
DROP TRIGGER IF EXISTS trg_payment_status_audit ON public.payments;
DROP FUNCTION IF EXISTS public.fn_payment_status_audit();

-- 2. Drop RLS policies
DROP POLICY IF EXISTS "Customers can read events for their payments" ON public.payment_events;
DROP POLICY IF EXISTS "Pros can read events for their payments" ON public.payment_events;
DROP POLICY IF EXISTS "Admins can read all payment events" ON public.payment_events;
DROP POLICY IF EXISTS "Service role manages payment events" ON public.payment_events;

-- 3. Drop table (cascades indexes)
DROP TABLE IF EXISTS public.payment_events;
