-- 073: Job mode enhancements — differentiate quick_hire vs get_quotes behavior
-- is_urgent: Quick Hire jobs flagged for priority display
-- max_quotes: Get Quotes = NULL (unlimited), Quick Hire = 5
-- auto_close_on_accept: close job when a quote is accepted (all modes)

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_quotes INT DEFAULT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS auto_close_on_accept BOOLEAN DEFAULT TRUE;

-- Backfill existing quick_hire jobs as urgent with max 5 quotes
UPDATE jobs
SET is_urgent = TRUE, max_quotes = 5
WHERE job_mode = 'quick_hire'
  AND is_urgent = FALSE;

-- Index for filtering urgent jobs
CREATE INDEX IF NOT EXISTS idx_jobs_is_urgent ON jobs (is_urgent) WHERE is_urgent = TRUE;

COMMENT ON COLUMN jobs.is_urgent IS 'Quick Hire jobs are marked urgent for priority badge display';
COMMENT ON COLUMN jobs.max_quotes IS 'Maximum quotes allowed — NULL means unlimited (Get Quotes mode)';
COMMENT ON COLUMN jobs.auto_close_on_accept IS 'Auto-close job when a quote is accepted';
