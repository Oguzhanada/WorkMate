-- Migration 045: API Keys for Public API access
-- Adds api_key (unique token) and api_rate_limit (requests/day) to profiles.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS api_key text unique,
  ADD COLUMN IF NOT EXISTS api_rate_limit integer not null default 1000;

-- Index for fast API key lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_api_key ON profiles (api_key) WHERE api_key IS NOT NULL;

-- RLS: profiles RLS already covers this column since profiles uses existing policies.
-- api_key is excluded from the public providers listing via explicit column selects in the API.
