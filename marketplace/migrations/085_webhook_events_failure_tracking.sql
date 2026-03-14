-- ============================================================
-- Migration 085 — Webhook Events: Failure Tracking
-- ============================================================
-- Adds status + error_message columns to webhook_events so the
-- Stripe webhook handler can mark failed events for admin review
-- and manual retry.
-- ============================================================

-- ── 1. ADD COLUMNS ─────────────────────────────────────────────
ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS status        text NOT NULL DEFAULT 'processed',
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS payload       jsonb;

-- ── 2. INDEX for admin failed-events query ─────────────────────
CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON public.webhook_events (status)
  WHERE status = 'failed';

-- ── 3. CHECK constraint on status values ───────────────────────
ALTER TABLE public.webhook_events
  ADD CONSTRAINT webhook_events_status_check
  CHECK (status IN ('processed', 'failed'));
