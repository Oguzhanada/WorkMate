-- Stripe Identity integration metadata.

alter table public.profiles
  add column if not exists stripe_identity_session_id text,
  add column if not exists stripe_identity_status text not null default 'not_started',
  add column if not exists stripe_identity_verified_at timestamptz,
  add column if not exists id_verification_method text not null default 'document_upload';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_stripe_identity_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_stripe_identity_status_check
      check (stripe_identity_status in ('not_started', 'requires_input', 'processing', 'verified', 'failed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_verification_method_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_id_verification_method_check
      check (id_verification_method in ('document_upload', 'stripe_identity'));
  end if;
end $$;

create index if not exists idx_profiles_stripe_identity_status
  on public.profiles(stripe_identity_status);

create index if not exists idx_profiles_stripe_identity_session_id
  on public.profiles(stripe_identity_session_id)
  where stripe_identity_session_id is not null;
