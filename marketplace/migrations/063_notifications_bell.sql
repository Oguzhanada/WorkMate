-- Migration 063: Extend notifications table for bell system
-- The notifications table already exists with: id, user_id, type, payload, read_at, created_at
-- RLS already enabled with select/update/delete policies for own rows.
-- We add: title, body, data columns + service_role INSERT policy + partial unread index.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS body  TEXT,
  ADD COLUMN IF NOT EXISTS data  JSONB DEFAULT '{}';

-- Backfill title from payload for existing rows so the bell component has something to show
UPDATE notifications
  SET title = COALESCE(
    payload->>'title',
    CASE type
      WHEN 'new_quote'                    THEN 'New quote received'
      WHEN 'new_message'                  THEN 'New private message'
      WHEN 'new_job_lead'                 THEN 'New job lead'
      WHEN 'admin_verification_update'    THEN 'Verification update'
      WHEN 'admin_document_update'        THEN 'Document update'
      WHEN 'job_pending_review'           THEN 'Job pending review'
      WHEN 'job_review_approved'          THEN 'Job approved'
      WHEN 'job_review_rejected'          THEN 'Job rejected'
      WHEN 'dispute_opened'               THEN 'Dispute opened'
      WHEN 'dispute_response_received'    THEN 'Dispute response received'
      WHEN 'dispute_resolved'             THEN 'Dispute resolved'
      WHEN 'dispute_escalated'            THEN 'Dispute escalated'
      WHEN 'payment_auto_released'        THEN 'Payment released'
      WHEN 'payment_release_reminder'     THEN 'Payment release reminder'
      ELSE 'Notification'
    END
  )
  WHERE title IS NULL;

-- Backfill data from payload
UPDATE notifications SET data = payload WHERE data IS NULL OR data = '{}'::jsonb;

-- Service role INSERT policy (new notifications written by server-side helpers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'notifications_service_insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "notifications_service_insert" ON notifications
        FOR INSERT TO service_role WITH CHECK (true)
    $policy$;
  END IF;
END$$;

-- Partial index for fast unread query per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;
