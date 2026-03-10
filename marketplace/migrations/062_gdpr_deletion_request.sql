-- Migration 061: GDPR self-service deletion request
-- Adds deletion_requested_at to profiles.
-- Soft-delete only — no immediate data removal.
-- A scheduled job or admin process handles hard-delete after the 30-day hold.

alter table public.profiles
  add column if not exists deletion_requested_at timestamptz default null;

-- Index for admin/cleanup job to efficiently find accounts due for deletion.
create index if not exists idx_profiles_deletion_requested_at
  on public.profiles (deletion_requested_at)
  where deletion_requested_at is not null;

comment on column public.profiles.deletion_requested_at is
  'Set when a user requests GDPR account deletion. Null = not requested. '
  'Permanent deletion is scheduled 30 days after this timestamp.';
