-- Migration 087: Enable pg_stat_statements and create slow query monitoring view
-- Additive only — safe to run on existing databases.

-- 1. Enable pg_stat_statements extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 2. Create a view for the top 20 slowest queries by mean execution time.
--    Accessible by service_role for admin health dashboards.
--
--    Usage:
--      SELECT * FROM v_slow_queries;
--    Run periodically or from the admin dashboard to identify
--    queries that need indexing or optimisation.
CREATE OR REPLACE VIEW public.v_slow_queries AS
SELECT
  LEFT(query, 200)                        AS query,
  calls,
  ROUND(total_exec_time::numeric, 2)      AS total_exec_time,
  ROUND(mean_exec_time::numeric, 2)       AS mean_exec_time,
  rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 3. Grant read access to service_role only
GRANT SELECT ON public.v_slow_queries TO service_role;

COMMENT ON VIEW public.v_slow_queries IS
  'Top 20 slowest queries by mean execution time. Source: pg_stat_statements. '
  'Use from admin dashboard or scheduled monitoring to find queries needing optimisation.';
