-- ============================================================
-- ROLLBACK for Migration 086 — Payment Events Trigger
-- ============================================================
-- Removes automatic audit trail trigger. After rollback, API
-- routes would need to manually INSERT payment_events rows.
-- The payment_events table (migration 084) is NOT affected.
-- ============================================================

DROP TRIGGER IF EXISTS trg_payment_status_audit ON public.payments;
DROP FUNCTION IF EXISTS public.fn_payment_status_audit();
