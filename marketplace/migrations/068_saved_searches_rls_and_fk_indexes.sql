-- Migration 068: saved_searches RLS audit + FK index coverage
--
-- 1. saved_searches RLS: Migration 066 already uses a FOR ALL policy with
--    USING + WITH CHECK, which covers SELECT/INSERT/UPDATE/DELETE.
--    No additional policies needed — included here for audit trail.
--
-- 2. FK indexes: Add missing indexes on foreign key columns across core,
--    payment, messaging, document, verification, dispute, job management,
--    notification, and contract tables. These prevent sequential scans on
--    JOIN and CASCADE DELETE operations.
--
-- Note: CONCURRENTLY cannot be used inside a transaction, so we use
-- regular CREATE INDEX IF NOT EXISTS.

-- ============================================================
-- PART 1: saved_searches RLS — no changes needed
-- ============================================================
-- Existing policy from 066:
--   "Users manage own saved searches" FOR ALL USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id)
-- This single FOR ALL policy already grants full CRUD to row owners.

-- ============================================================
-- PART 2: Missing FK indexes
-- ============================================================

-- Core tables (highest query frequency)
CREATE INDEX IF NOT EXISTS idx_addresses_profile_id ON addresses(profile_id);
CREATE INDEX IF NOT EXISTS idx_jobs_accepted_quote_id ON jobs(accepted_quote_id);
CREATE INDEX IF NOT EXISTS idx_jobs_address_id ON jobs(address_id);
CREATE INDEX IF NOT EXISTS idx_jobs_reviewed_by ON jobs(reviewed_by);

-- Payments (all 4 FK columns)
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_pro_id ON payments(pro_id);
CREATE INDEX IF NOT EXISTS idx_payments_quote_id ON payments(quote_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_job_messages_sender_id ON job_messages(sender_id);

-- Documents
CREATE INDEX IF NOT EXISTS idx_pro_documents_replaced_by ON pro_documents(replaced_by_document_id);
CREATE INDEX IF NOT EXISTS idx_pro_documents_reviewed_by ON pro_documents(reviewed_by);

-- Verification
CREATE INDEX IF NOT EXISTS idx_verification_checks_created_by ON verification_checks(created_by);
CREATE INDEX IF NOT EXISTS idx_profiles_id_verification_reviewed_by ON profiles(id_verification_reviewed_by);

-- Job intents
CREATE INDEX IF NOT EXISTS idx_job_intents_category_id ON job_intents(category_id);
CREATE INDEX IF NOT EXISTS idx_job_intents_claimed_by ON job_intents(claimed_by);
CREATE INDEX IF NOT EXISTS idx_job_intents_published_job_id ON job_intents(published_job_id);

-- Admin/audit
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_id_verification_retention_logs_profile_id ON id_verification_retention_logs(profile_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_provider_doc_notifications_document_id ON provider_document_notifications(document_id);

-- Disputes
CREATE INDEX IF NOT EXISTS idx_disputes_created_by ON disputes(created_by);
CREATE INDEX IF NOT EXISTS idx_disputes_resolved_by ON disputes(resolved_by);
CREATE INDEX IF NOT EXISTS idx_dispute_logs_actor_id ON dispute_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_uploaded_by ON dispute_evidence(uploaded_by);

-- Job management
CREATE INDEX IF NOT EXISTS idx_job_todos_assigned_to ON job_todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_job_todos_created_by ON job_todos(created_by);
CREATE INDEX IF NOT EXISTS idx_automation_rules_created_by ON automation_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_time_entries_approved_by ON time_entries(approved_by);

-- Contracts
CREATE INDEX IF NOT EXISTS idx_job_contracts_quote_id ON job_contracts(quote_id);
