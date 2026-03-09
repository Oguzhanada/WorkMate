-- Migration 060: API key hashing (hash-first — no plaintext stored)
-- Replaces the skipped migration 045. Plaintext api_key column never created.
-- api_key_hash stores SHA-256(plaintext_key) as hex. Key shown to user once on generation.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS api_key_hash    TEXT    UNIQUE,
  ADD COLUMN IF NOT EXISTS api_rate_limit  INTEGER NOT NULL DEFAULT 1000;

-- Fast lookup by hash on every public API request
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_api_key_hash
  ON profiles (api_key_hash)
  WHERE api_key_hash IS NOT NULL;
