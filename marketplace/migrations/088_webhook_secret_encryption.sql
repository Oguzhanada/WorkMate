-- Migration 088: Add encrypted_secret column for webhook subscriptions
-- Part of security audit: encrypt webhook secrets at rest (AES-256-GCM)
--
-- The plaintext `secret` column is NOT dropped in this migration.
-- A separate Node.js script must encrypt existing secrets before the old
-- column can be removed. This is the safe, additive approach.

-- Add new column for encrypted secrets
ALTER TABLE webhook_subscriptions ADD COLUMN IF NOT EXISTS encrypted_secret TEXT;

-- Document the encryption format
COMMENT ON COLUMN webhook_subscriptions.encrypted_secret IS 'AES-256-GCM encrypted webhook secret. Format: iv:authTag:ciphertext (hex). Decrypted at delivery time in lib/webhook/send.ts';
