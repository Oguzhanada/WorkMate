-- Migration 071: Founding Pro Program
-- Early-adopter program for the first 100 providers on WorkMate.

-- ── Add founding pro columns to profiles ─────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_founding_pro       BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS founding_pro_joined_at TIMESTAMPTZ;

-- ── Founding Pro config table (single-row) ───────────────────────────────────
CREATE TABLE founding_pro_config (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  max_slots       INT         NOT NULL DEFAULT 100,
  current_count   INT         NOT NULL DEFAULT 0,
  program_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE founding_pro_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read the config (public program status)
CREATE POLICY "Anyone can read founding pro config" ON founding_pro_config
  FOR SELECT USING (true);

-- Only admins can update config
CREATE POLICY "Admins update founding pro config" ON founding_pro_config
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── Seed default config row ──────────────────────────────────────────────────
INSERT INTO founding_pro_config (max_slots, current_count, program_active)
VALUES (100, 0, true);

-- ── Index for quick lookups ──────────────────────────────────────────────────
CREATE INDEX idx_profiles_founding_pro ON profiles(is_founding_pro)
  WHERE is_founding_pro = true;
