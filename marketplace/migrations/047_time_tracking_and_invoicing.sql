-- Migration 047: Time tracking + invoicing support
-- Adds provider time entries with customer approval workflow and job invoice metadata.

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer generated always as (
    case
      when ended_at is null then null
      else greatest(floor(extract(epoch from (ended_at - started_at)) / 60)::integer, 0)
    end
  ) stored,
  hourly_rate integer,
  description text,
  approved boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'time_entries_hourly_rate_check'
      and conrelid = 'public.time_entries'::regclass
  ) then
    alter table public.time_entries
      add constraint time_entries_hourly_rate_check
      check (hourly_rate is null or hourly_rate > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'time_entries_end_after_start_check'
      and conrelid = 'public.time_entries'::regclass
  ) then
    alter table public.time_entries
      add constraint time_entries_end_after_start_check
      check (ended_at is null or ended_at >= started_at);
  end if;
end $$;

create index if not exists idx_time_entries_job on public.time_entries(job_id, created_at desc);
create index if not exists idx_time_entries_provider on public.time_entries(provider_id, created_at desc);
create index if not exists idx_time_entries_approved on public.time_entries(job_id, approved);

create or replace function public.set_time_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_time_entries_updated_at on public.time_entries;
create trigger trg_time_entries_updated_at
before update on public.time_entries
for each row execute function public.set_time_entries_updated_at();

alter table public.time_entries enable row level security;

drop policy if exists time_entries_select_participants on public.time_entries;
create policy time_entries_select_participants
on public.time_entries
for select
to authenticated
using (
  provider_id = auth.uid()
  or exists (
    select 1
    from public.jobs j
    where j.id = time_entries.job_id
      and j.customer_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists time_entries_insert_assigned_provider on public.time_entries;
create policy time_entries_insert_assigned_provider
on public.time_entries
for insert
to authenticated
with check (
  provider_id = auth.uid()
  and exists (
    select 1
    from public.jobs j
    join public.quotes q on q.id = j.accepted_quote_id
    where j.id = time_entries.job_id
      and q.pro_id = auth.uid()
  )
);

drop policy if exists time_entries_update_participants on public.time_entries;
create policy time_entries_update_participants
on public.time_entries
for update
to authenticated
using (
  provider_id = auth.uid()
  or exists (
    select 1
    from public.jobs j
    where j.id = time_entries.job_id
      and j.customer_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
)
with check (
  provider_id = auth.uid()
  or exists (
    select 1
    from public.jobs j
    where j.id = time_entries.job_id
      and j.customer_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists time_entries_delete_provider_or_admin on public.time_entries;
create policy time_entries_delete_provider_or_admin
on public.time_entries
for delete
to authenticated
using (
  provider_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

alter table public.jobs
  add column if not exists stripe_invoice_id text,
  add column if not exists invoiced_at timestamptz;

create unique index if not exists idx_jobs_stripe_invoice_id_unique
  on public.jobs(stripe_invoice_id)
  where stripe_invoice_id is not null;
