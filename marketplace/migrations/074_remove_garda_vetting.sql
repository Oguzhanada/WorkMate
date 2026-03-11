-- Remove Garda Vetting columns (no longer supported - cannot verify)
ALTER TABLE profiles
  DROP COLUMN IF EXISTS garda_vetting_status,
  DROP COLUMN IF EXISTS garda_vetting_reference,
  DROP COLUMN IF EXISTS garda_vetting_expires_at;

DROP INDEX IF EXISTS idx_profiles_garda_vetting_status;
