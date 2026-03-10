-- Migration 061: Funnel events table for step-based abandonment analytics
-- Tracks job posting, provider onboarding, and booking funnel progression.
-- No PII stored — user_id is a UUID reference only; metadata is non-PII context.

CREATE TABLE funnel_events (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  TEXT         NOT NULL,
  funnel_name TEXT         NOT NULL,  -- 'job_posting' | 'provider_onboarding' | 'booking'
  step_name   TEXT         NOT NULL,  -- e.g. 'category_selected', 'description_written', 'submitted'
  step_number INTEGER      NOT NULL,
  metadata    JSONB        DEFAULT '{}',  -- non-PII context (category_id, etc.)
  abandoned_at TIMESTAMPTZ,              -- set when follow-up event not seen within 30 min
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- RLS
ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own events; anonymous (user_id IS NULL) allowed too.
CREATE POLICY "Users insert own events"
  ON funnel_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Unauthenticated (anon role) callers may also insert when user_id is null.
CREATE POLICY "Anon insert null-user events"
  ON funnel_events
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Only admins may read funnel data.
CREATE POLICY "Admin read all events"
  ON funnel_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Indices for analytic queries
CREATE INDEX idx_funnel_events_funnel_name ON funnel_events(funnel_name, step_name);
CREATE INDEX idx_funnel_events_user_id     ON funnel_events(user_id);
CREATE INDEX idx_funnel_events_created_at  ON funnel_events(created_at DESC);
