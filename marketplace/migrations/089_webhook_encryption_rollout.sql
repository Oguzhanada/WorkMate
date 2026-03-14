-- ============================================================
-- Migration 089 — Complete Webhook Secret Encryption Rollout
-- ============================================================
-- Finalises the AES-256-GCM encryption work started in 088.
--
-- Prerequisites (must be true before applying):
--   1. Code deployed: subscribe route no longer writes `secret`
--   2. Code deployed: send.ts no longer reads `secret`
--   3. Every row in webhook_subscriptions has encrypted_secret
--   4. WEBHOOK_SECRET_ENCRYPTION_KEY env var set in all envs
--
-- What this migration does:
--   1. Drops the NOT NULL constraint on the legacy `secret` column
--      (safety net in case code deploys before migration)
--   2. Makes `encrypted_secret` NOT NULL
--   3. Drops the plaintext `secret` column permanently
-- ============================================================

-- 1. Allow NULLs on legacy column (safe bridge during deploy)
ALTER TABLE public.webhook_subscriptions
  ALTER COLUMN secret DROP NOT NULL;

-- 2. Enforce encrypted_secret is always present
ALTER TABLE public.webhook_subscriptions
  ALTER COLUMN encrypted_secret SET NOT NULL;

-- 3. Remove plaintext secret column — at-rest encryption complete
ALTER TABLE public.webhook_subscriptions
  DROP COLUMN IF EXISTS secret;

-- 4. Document the change
COMMENT ON TABLE public.webhook_subscriptions IS
  'Webhook subscriptions. Secrets encrypted at rest via AES-256-GCM (encrypted_secret). Plaintext column removed in migration 089.';
COMMENT ON COLUMN public.webhook_subscriptions.encrypted_secret IS
  'AES-256-GCM encrypted signing secret. Format: iv:authTag:ciphertext (hex). Decrypted at delivery time only.';
