-- ============================================================
-- Migration 083 — Idempotency Keys
-- ============================================================
-- Prevents duplicate mutations on critical endpoints:
--   create-secure-hold, capture-payment, accept-quote, create-job
-- TTL: 24 hours. Daily cron removes expired keys at 02:00 UTC.
-- RLS: users read own keys; service_role writes all; admins read all.
-- ============================================================

-- ── 1. TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text        NOT NULL,
  route           text        NOT NULL,
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  response_status int         NOT NULL,
  response_body   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),

  CONSTRAINT uq_idempotency_key UNIQUE (key)
);

-- ── 2. INDEXES ───────────────────────────────────────────────
-- Fast TTL-based cleanup
CREATE INDEX idx_idempotency_keys_expires_at
  ON public.idempotency_keys (expires_at);

-- Per-user lookup
CREATE INDEX idx_idempotency_keys_user_id
  ON public.idempotency_keys (user_id);

-- ── 3. RLS ───────────────────────────────────────────────────
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Users can read their own keys
CREATE POLICY "Users can read own idempotency keys"
  ON public.idempotency_keys
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role manages all (API route handlers write here)
CREATE POLICY "Service role manages idempotency keys"
  ON public.idempotency_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can read all keys (audit / ops)
CREATE POLICY "Admins can read all idempotency keys"
  ON public.idempotency_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 4. pg_cron: daily cleanup of expired rows ────────────────
SELECT cron.schedule(
  'cleanup-idempotency-keys',
  '0 2 * * *',
  $$DELETE FROM public.idempotency_keys WHERE expires_at < now()$$
);
