-- ============================================================
-- Migration 082 — Provider Full-Text Search
-- ============================================================
-- Prerequisites: pg_trgm + unaccent enabled in migration 081
-- Materialized view joins profiles → pro_services → categories
-- to build a rich tsvector (full_name + username + category names).
-- REFRESH CONCURRENTLY requires a unique index (idx below).
-- ============================================================

-- ── 1. MATERIALIZED VIEW ─────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS public.provider_search AS
WITH provider_categories AS (
  SELECT
    ps.profile_id,
    string_agg(DISTINCT unaccent(coalesce(c.name, '')), ' ') AS category_text
  FROM public.pro_services ps
  JOIN public.categories c ON c.id = ps.category_id
  GROUP BY ps.profile_id
)
SELECT
  p.id                          AS provider_id,
  p.full_name,
  p.username,
  p.is_verified,
  p.compliance_score,
  p.provider_matching_priority,
  to_tsvector(
    'english',
    unaccent(coalesce(p.full_name, ''))
    || ' ' ||
    unaccent(coalesce(p.username, ''))
    || ' ' ||
    coalesce(pc.category_text, '')
  )                             AS search_vector,
  coalesce(pc.category_text, '') AS category_names
FROM public.profiles p
LEFT JOIN provider_categories pc ON pc.profile_id = p.id
WHERE p.is_verified = true;

-- ── 2. UNIQUE INDEX (required for REFRESH MATERIALIZED VIEW CONCURRENTLY)
CREATE UNIQUE INDEX idx_provider_search_provider_id
  ON public.provider_search (provider_id);

-- ── 3. GIN INDEX on tsvector ──────────────────────────────────
CREATE INDEX idx_provider_search_vector
  ON public.provider_search USING GIN (search_vector);

-- ── 4. Trigram GIN index for similarity() / fuzzy matching ───
CREATE INDEX idx_provider_search_fullname_trgm
  ON public.provider_search USING GIN (full_name gin_trgm_ops);

-- ── 5. pg_cron: refresh hourly (concurrent — non-blocking) ───
SELECT cron.schedule(
  'refresh-provider-search',
  '30 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY public.provider_search$$
);
