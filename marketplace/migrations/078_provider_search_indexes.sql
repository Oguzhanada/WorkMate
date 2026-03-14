-- ============================================================
-- Migration 078 — Provider Search Performance Indexes
-- ============================================================
-- WARNING: This migration uses CREATE INDEX CONCURRENTLY.
-- CONCURRENTLY indexes CANNOT run inside a transaction block.
-- Apply each CREATE INDEX statement INDIVIDUALLY via the
-- Supabase SQL Editor or MCP execute_sql — do NOT paste the
-- entire file as a single batch.
-- ============================================================
-- Sprint 6 — scalability at 1 000+ providers
-- Additive only, no destructive changes.
-- Bug fixes applied 2026-03-14: corrected column names
-- (profile_id→user_id, step→step_name, created_at→processed_at)
-- and enum value (provider→verified_pro) to match actual schema.

-- ─────────────────────────────────────────────
-- 1. Profiles: composite index for provider search
--    Used by GET /api/providers/search?category=X&county=Y
-- ─────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role_verification
  ON profiles (role, verification_status)
  WHERE role = 'verified_pro';

-- ─────────────────────────────────────────────
-- 2. Jobs: status + customer composite (dashboard list)
--    Used by GET /api/jobs?status=open&customerId=X
-- ─────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status_customer
  ON jobs (status, customer_id);

-- ─────────────────────────────────────────────
-- 3. Jobs: status + created_at for open job feed
--    Used by provider browse & task alert matching
-- ─────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_open_created
  ON jobs (created_at DESC)
  WHERE status = 'open';

-- ─────────────────────────────────────────────
-- 4. Quotes: job_id + pro_id composite
--    Used by ranking queries and provider history
-- ─────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_job_pro
  ON quotes (job_id, pro_id);

-- ─────────────────────────────────────────────
-- 5. Quotes: ranking score descending
--    Used by GET /api/providers/search ranking_score DESC
-- ─────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_ranking_score
  ON quotes (ranking_score DESC NULLS LAST);

-- ─────────────────────────────────────────────
-- 6. Reviews: pro_id + created_at for profile page
--    Used by provider public profile latest reviews
-- ─────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_pro_created
  ON reviews (pro_id, created_at DESC);

-- ─────────────────────────────────────────────
-- 7. Notifications: profile_id + read_at for bell icon
--    Used by GET /api/notifications?unread=true
-- ─────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_profile_unread
  ON notifications (user_id, read_at)
  WHERE read_at IS NULL;

-- ─────────────────────────────────────────────
-- 8. Funnel events: funnel_name + step for analytics
--    Used by GET /api/admin/analytics funnel queries
-- ─────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnel_events_funnel_step
  ON funnel_events (funnel_name, step_name, created_at DESC);

-- ─────────────────────────────────────────────
-- 9. Credit transactions: provider_id + created_at
--    Used by GET /api/provider/credits transaction history
-- ─────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_provider_created
  ON credit_transactions (provider_id, created_at DESC);

-- ─────────────────────────────────────────────
-- 10. Webhook events: status + created_at for monitoring
--     Used by webhook delivery latency SLA queries
-- ─────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_events_status_created
  ON webhook_events (status, processed_at DESC);

COMMENT ON INDEX idx_profiles_role_verification IS 'Speeds up provider search — role + verification_status filter';
COMMENT ON INDEX idx_jobs_status_customer IS 'Speeds up customer dashboard job list';
COMMENT ON INDEX idx_jobs_open_created IS 'Speeds up provider browse and task alert matching';
COMMENT ON INDEX idx_quotes_job_pro IS 'Speeds up offer panel and provider history';
COMMENT ON INDEX idx_quotes_ranking_score IS 'Speeds up ranked quote display';
COMMENT ON INDEX idx_reviews_pro_created IS 'Speeds up provider public profile reviews section';
COMMENT ON INDEX idx_notifications_profile_unread IS 'Speeds up notification bell unread count';
COMMENT ON INDEX idx_funnel_events_funnel_step IS 'Speeds up admin analytics funnel queries';
COMMENT ON INDEX idx_credit_transactions_provider_created IS 'Speeds up provider credit history page';
COMMENT ON INDEX idx_webhook_events_status_created IS 'Speeds up webhook delivery monitoring';
