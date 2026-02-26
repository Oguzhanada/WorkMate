-- Progressive ID verification tiered access

alter table public.jobs
  add column if not exists job_visibility_tier text not null default 'basic',
  add column if not exists created_by_verified_id boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_job_visibility_tier_check'
  ) then
    alter table public.jobs
      add constraint jobs_job_visibility_tier_check
      check (job_visibility_tier in ('basic', 'verified_tier'));
  end if;
end $$;

create index if not exists idx_jobs_visibility_tier_created_at
  on public.jobs (job_visibility_tier, created_at desc);

alter table public.profiles
  add column if not exists provider_matching_priority integer not null default 1;

create index if not exists idx_profiles_provider_matching_priority
  on public.profiles (provider_matching_priority desc);

create table if not exists public.quote_daily_limits (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  quote_date date not null,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, quote_date),
  constraint quote_daily_limits_used_count_check check (used_count >= 0)
);

create index if not exists idx_quote_daily_limits_quote_date
  on public.quote_daily_limits (quote_date);

create or replace function public.touch_quote_daily_limits_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_quote_daily_limits_updated_at on public.quote_daily_limits;
create trigger trg_quote_daily_limits_updated_at
before update on public.quote_daily_limits
for each row
execute function public.touch_quote_daily_limits_updated_at();

create or replace function public.sync_provider_matching_priority_from_id_status()
returns trigger
language plpgsql
as $$
begin
  if new.id_verification_status = 'approved' then
    new.provider_matching_priority := 10;
  else
    new.provider_matching_priority := 1;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_sync_provider_priority on public.profiles;
create trigger trg_profiles_sync_provider_priority
before insert or update of id_verification_status on public.profiles
for each row
execute function public.sync_provider_matching_priority_from_id_status();

update public.profiles
set provider_matching_priority = case when id_verification_status = 'approved' then 10 else 1 end
where provider_matching_priority is distinct from case when id_verification_status = 'approved' then 10 else 1 end;

alter table public.quote_daily_limits enable row level security;

drop policy if exists quote_daily_limits_select_own on public.quote_daily_limits;
create policy quote_daily_limits_select_own
on public.quote_daily_limits
for select
using (
  auth.uid() = profile_id
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

drop policy if exists quote_daily_limits_insert_own on public.quote_daily_limits;
create policy quote_daily_limits_insert_own
on public.quote_daily_limits
for insert
with check (
  auth.uid() = profile_id
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

drop policy if exists quote_daily_limits_update_own on public.quote_daily_limits;
create policy quote_daily_limits_update_own
on public.quote_daily_limits
for update
using (
  auth.uid() = profile_id
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
)
with check (
  auth.uid() = profile_id
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

drop policy if exists quote_daily_limits_delete_admin on public.quote_daily_limits;
create policy quote_daily_limits_delete_admin
on public.quote_daily_limits
for delete
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);
