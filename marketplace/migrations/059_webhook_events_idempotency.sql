-- Migration 059: webhook_events idempotency table
-- Prevents duplicate Stripe event processing on webhook replay.
-- Each stripe_event_id is unique; insert fails (conflict) if already processed.

CREATE TABLE IF NOT EXISTS webhook_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id  TEXT        NOT NULL,
  event_type       TEXT        NOT NULL,
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_stripe_event_id_unique UNIQUE (stripe_event_id)
);

-- Index for fast lookups by event id
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id
  ON webhook_events (stripe_event_id);

-- RLS: this table is only ever written by the service role (webhook handler).
-- No end-user should read or write it directly.
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Admins can read for audit/debugging; no one else.
CREATE POLICY "webhook_events_admin_select"
  ON webhook_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- All writes go through service_role (bypasses RLS) — no INSERT policy needed.
