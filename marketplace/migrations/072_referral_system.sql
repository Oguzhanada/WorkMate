-- Migration 072: Referral System Foundation
-- Each founding pro gets a unique referral code. Redeemed codes are tracked.

-- ── Referral codes table ─────────────────────────────────────────────────────
CREATE TABLE referral_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  code        TEXT        NOT NULL UNIQUE,
  uses_count  INT         NOT NULL DEFAULT 0,
  max_uses    INT         NOT NULL DEFAULT 10,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral codes
CREATE POLICY "Users read own referral codes" ON referral_codes
  FOR SELECT TO authenticated
  USING (auth.uid() = profile_id);

-- Admins can read all referral codes
CREATE POLICY "Admins read all referral codes" ON referral_codes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── Referral redemptions table ───────────────────────────────────────────────
CREATE TABLE referral_redemptions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID        NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  redeemed_by      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (referral_code_id, redeemed_by)
);

ALTER TABLE referral_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own redemptions
CREATE POLICY "Users read own redemptions" ON referral_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = redeemed_by);

-- Authenticated users can redeem (insert) a code
CREATE POLICY "Authenticated users can redeem" ON referral_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = redeemed_by);

-- Admins can read all redemptions
CREATE POLICY "Admins read all redemptions" ON referral_redemptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_referral_codes_profile ON referral_codes(profile_id);
CREATE INDEX idx_referral_redemptions_code ON referral_redemptions(referral_code_id);

-- ── Auto-generate referral code for founding pros ────────────────────────────
-- Trigger: when a profile becomes a founding pro, create a referral code
CREATE OR REPLACE FUNCTION generate_founding_pro_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_founding_pro = true AND (OLD.is_founding_pro IS NULL OR OLD.is_founding_pro = false) THEN
    INSERT INTO referral_codes (profile_id, code, max_uses)
    VALUES (
      NEW.id,
      'WM-' || UPPER(SUBSTR(MD5(NEW.id::TEXT || NOW()::TEXT), 1, 8)),
      10
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_founding_pro_referral_code
  AFTER UPDATE OF is_founding_pro ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_founding_pro_referral_code();
