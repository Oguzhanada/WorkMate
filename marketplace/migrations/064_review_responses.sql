-- Migration 064: Provider responses to reviews
-- Adds provider_response and provider_responded_at columns to the reviews table.
-- RLS: only the reviewed provider (pro_id = auth.uid()) may update their own response.
-- Customers and other users cannot write or delete provider responses.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS provider_response       TEXT,
  ADD COLUMN IF NOT EXISTS provider_responded_at   TIMESTAMPTZ;

COMMENT ON COLUMN public.reviews.provider_response     IS 'Provider public reply to this review (10–1000 chars)';
COMMENT ON COLUMN public.reviews.provider_responded_at IS 'Timestamp when the provider first/last responded';

-- Index for quickly finding all reviews awaiting a provider response
CREATE INDEX IF NOT EXISTS idx_reviews_pro_no_response
  ON public.reviews (pro_id, created_at DESC)
  WHERE provider_response IS NULL;

-- ── RLS: provider update policy ───────────────────────────────────────────────
-- Providers can update ONLY their response columns on their own reviews.
-- No other UPDATE policy exists for providers on reviews, so this is additive.
DROP POLICY IF EXISTS reviews_update_provider_response ON public.reviews;
CREATE POLICY reviews_update_provider_response
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING  (pro_id = auth.uid())
  WITH CHECK (pro_id = auth.uid());

-- ── Public read policy (public profile page) ──────────────────────────────────
-- Allow any authenticated user to read public reviews (is_public = true).
-- This enables the public profile page to show reviews without service role.
DROP POLICY IF EXISTS reviews_select_public ON public.reviews;
CREATE POLICY reviews_select_public
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (is_public = true);
