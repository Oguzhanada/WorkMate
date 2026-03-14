-- ============================================================
-- Migration 086 — Payment Events Trigger (Automatic Audit Trail)
-- ============================================================
-- Adds an AFTER UPDATE trigger on public.payments so that every
-- status change is automatically logged to public.payment_events.
-- This removes the need for API routes to manually INSERT audit
-- rows and guarantees no status transition is ever missed.
--
-- The trigger only fires when OLD.status IS DISTINCT FROM
-- NEW.status, avoiding no-op audit rows on unrelated updates.
-- ============================================================

-- ── 1. TRIGGER FUNCTION ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_payment_status_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.payment_events (
    payment_id,
    event_type,
    old_status,
    new_status,
    metadata,
    actor_id,
    created_at
  ) VALUES (
    NEW.id,
    'status_change',
    OLD.status,
    NEW.status,
    jsonb_build_object(
      'triggered_by', 'db_trigger',
      'table',        'payments'
    ),
    NULL,
    now()
  );

  RETURN NEW;
END;
$$;

-- ── 2. TRIGGER ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_payment_status_audit ON public.payments;

CREATE TRIGGER trg_payment_status_audit
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.fn_payment_status_audit();
