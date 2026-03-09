-- Migration 066: Provider Portfolio / Work Gallery
-- Simple single-image gallery items (distinct from pro_portfolio before/after table)
CREATE TABLE portfolio_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL,
  description    TEXT,
  image_url      TEXT        NOT NULL,
  display_order  SMALLINT    NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider manages own portfolio" ON portfolio_items
  FOR ALL TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Anyone reads portfolio" ON portfolio_items
  FOR SELECT USING (true);

CREATE INDEX idx_portfolio_provider ON portfolio_items(provider_id, display_order ASC);
