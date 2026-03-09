-- Migration 064: provider_availability weekly schedule table
-- Stores per-provider weekly recurring availability (one row per day of week)

CREATE TABLE provider_availability (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week     SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun … 6=Sat
  start_time      TIME        NOT NULL,  -- e.g. 08:00
  end_time        TIME        NOT NULL,  -- e.g. 18:00
  is_available    BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, day_of_week),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;

-- Provider can fully manage their own rows
CREATE POLICY "Provider manages own availability"
  ON provider_availability
  FOR ALL
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Any authenticated user can read any provider's schedule
CREATE POLICY "Anyone can read availability"
  ON provider_availability
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_availability_provider ON provider_availability(provider_id);
