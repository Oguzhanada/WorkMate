-- ============================================================
-- Migration 084 — Payment Events (Audit Trail)
-- ============================================================
-- Immutable event log for every payment status transition.
-- Provides full audit trail for disputes, refunds, and compliance.
-- References public.payments (not job_payments — see migration chain).
-- RLS: customer/pro see events for their own payments; admin sees all;
--      service_role inserts from API routes.
-- ============================================================

-- ── 1. TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id   uuid        NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  event_type   text        NOT NULL,
  old_status   text,
  new_status   text,
  metadata     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  actor_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 2. INDEXES ───────────────────────────────────────────────
-- Primary access pattern: all events for a payment, newest first
CREATE INDEX idx_payment_events_payment_id
  ON public.payment_events (payment_id, created_at DESC);

-- Secondary: events by actor (admin audit)
CREATE INDEX idx_payment_events_actor_id
  ON public.payment_events (actor_id)
  WHERE actor_id IS NOT NULL;

-- ── 3. RLS ───────────────────────────────────────────────────
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Customer can read events for payments they created
CREATE POLICY "Customers can read events for their payments"
  ON public.payment_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.payments
      WHERE id = payment_id
        AND customer_id = auth.uid()
    )
  );

-- Pro can read events for payments they are party to
CREATE POLICY "Pros can read events for their payments"
  ON public.payment_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.payments
      WHERE id = payment_id
        AND pro_id = auth.uid()
    )
  );

-- Admin can read all payment events
CREATE POLICY "Admins can read all payment events"
  ON public.payment_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role manages all (inserts from API route handlers)
CREATE POLICY "Service role manages payment events"
  ON public.payment_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
