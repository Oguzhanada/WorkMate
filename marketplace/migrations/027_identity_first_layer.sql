-- Identity-first layer (separate from existing provider verification_status flow)

alter table public.profiles
  add column if not exists id_verification_status text not null default 'none',
  add column if not exists id_verification_document_url text,
  add column if not exists id_verification_submitted_at timestamptz,
  add column if not exists id_verification_rejected_reason text,
  add column if not exists id_verification_reviewed_by uuid references public.profiles(id),
  add column if not exists id_verification_reviewed_at timestamptz,
  add column if not exists tax_clearance_number text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_verification_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_id_verification_status_check
      check (id_verification_status in ('none', 'pending', 'approved', 'rejected'));
  end if;
end $$;

create index if not exists idx_profiles_id_verification_status
  on public.profiles (id_verification_status);

alter table public.jobs
  add column if not exists requires_verified_id boolean not null default true;

create index if not exists idx_jobs_requires_verified_id
  on public.jobs (requires_verified_id);
