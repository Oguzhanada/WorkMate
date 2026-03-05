-- Migration 040: provider_rankings nightly health check
-- Adds a pg_cron job that refreshes the provider_rankings materialized view
-- nightly and logs failures to a dedicated health_check_log table.
-- Apply via Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Health check log table
-- ---------------------------------------------------------------------------

create table if not exists public.health_check_log (
  id             bigserial primary key,
  check_name     text        not null,
  status         text        not null check (status in ('ok', 'error')),
  detail         text,
  checked_at     timestamptz not null default now()
);

-- Keep at most 90 days of history
create index if not exists idx_health_check_log_checked_at
  on public.health_check_log (checked_at desc);

-- RLS: only admins and service role may read
alter table public.health_check_log enable row level security;

create policy "Admin can read health check log"
  on public.health_check_log for select
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Refresh function with error capture
-- ---------------------------------------------------------------------------

create or replace function public.refresh_provider_rankings_safe()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.provider_rankings;

  insert into public.health_check_log (check_name, status, detail)
  values ('provider_rankings_refresh', 'ok', null);

exception when others then
  insert into public.health_check_log (check_name, status, detail)
  values ('provider_rankings_refresh', 'error', sqlerrm);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. pg_cron schedule — runs every night at 03:00 UTC
-- (pg_cron extension must be enabled in the Supabase project)
-- ---------------------------------------------------------------------------

select cron.schedule(
  'refresh-provider-rankings-nightly',
  '0 3 * * *',
  $$ select public.refresh_provider_rankings_safe(); $$
);

-- ---------------------------------------------------------------------------
-- 4. Cleanup function — purge log rows older than 90 days (weekly)
-- ---------------------------------------------------------------------------

create or replace function public.purge_old_health_check_logs()
returns void
language sql
security definer
as $$
  delete from public.health_check_log
  where checked_at < now() - interval '90 days';
$$;

select cron.schedule(
  'purge-health-check-logs-weekly',
  '0 4 * * 0',
  $$ select public.purge_old_health_check_logs(); $$
);
