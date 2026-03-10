-- Migration 069: Consolidate portfolio tables
-- Both pro_portfolio (rich: before/after images, category, visibility) and
-- portfolio_items (simple: single image, display_order) are in active use.
-- Strategy: migrate pro_portfolio data INTO portfolio_items (adding missing columns),
-- then drop the legacy pro_portfolio table.

-- Step 1: Add columns from pro_portfolio that portfolio_items lacks
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS before_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS after_image_url   TEXT,
  ADD COLUMN IF NOT EXISTS category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS experience_note   TEXT,
  ADD COLUMN IF NOT EXISTS visibility_scope  TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS is_public         BOOLEAN NOT NULL DEFAULT TRUE;

-- Rename image_url to be unambiguous (it is the single/primary image)
-- Keep image_url as-is for backward compat; before/after are optional extras.

-- Step 2: Migrate existing pro_portfolio rows into portfolio_items
INSERT INTO portfolio_items (
  provider_id,
  title,
  description,
  image_url,
  display_order,
  before_image_url,
  after_image_url,
  category_id,
  experience_note,
  visibility_scope,
  is_public,
  created_at
)
SELECT
  profile_id,
  title,
  experience_note,                              -- map to description
  COALESCE(after_image_url, before_image_url),  -- primary image = after (or before as fallback)
  0,                                            -- display_order default
  before_image_url,
  after_image_url,
  category_id,
  experience_note,
  COALESCE(visibility_scope, 'public'),
  COALESCE(is_public, TRUE),
  created_at
FROM pro_portfolio
WHERE NOT EXISTS (
  -- Avoid duplicates if migration is re-run
  SELECT 1 FROM portfolio_items pi
  WHERE pi.provider_id = pro_portfolio.profile_id
    AND pi.title = pro_portfolio.title
    AND pi.before_image_url = pro_portfolio.before_image_url
);

-- Step 3: Drop the legacy table
DROP TABLE IF EXISTS pro_portfolio;

-- Step 4: Index for visibility filtering
CREATE INDEX IF NOT EXISTS idx_portfolio_items_visibility
  ON portfolio_items(provider_id, visibility_scope)
  WHERE is_public = TRUE;
