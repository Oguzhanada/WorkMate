-- Migration 066: Customer Saved Searches & Job Alert Preferences
-- Allows customers to save provider search criteria and manage notification preferences.

CREATE TABLE saved_searches (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  filters          JSONB       NOT NULL DEFAULT '{}',
  notify_email     BOOLEAN     NOT NULL DEFAULT false,
  notify_bell      BOOLEAN     NOT NULL DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved searches"
  ON saved_searches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
