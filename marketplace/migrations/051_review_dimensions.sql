-- Migration 051: Multi-dimension review ratings
-- Adds quality, communication, punctuality, and value rating columns to the reviews table.
-- All columns are nullable integers (1–5) so existing reviews are unaffected.
-- The API route /api/reviews already validates and inserts these columns.

alter table public.reviews
  add column if not exists quality_rating integer check (quality_rating between 1 and 5),
  add column if not exists communication_rating integer check (communication_rating between 1 and 5),
  add column if not exists punctuality_rating integer check (punctuality_rating between 1 and 5),
  add column if not exists value_rating integer check (value_rating between 1 and 5),
  add column if not exists is_public boolean not null default true;

-- Index to quickly compute per-provider dimension averages
create index if not exists idx_reviews_pro_id
  on public.reviews(pro_id);

comment on column public.reviews.quality_rating is 'Customer rating for quality of work (1–5)';
comment on column public.reviews.communication_rating is 'Customer rating for provider communication (1–5)';
comment on column public.reviews.punctuality_rating is 'Customer rating for punctuality (1–5)';
comment on column public.reviews.value_rating is 'Customer rating for value for money (1–5)';
comment on column public.reviews.is_public is 'Whether the review is shown on the public provider profile';
