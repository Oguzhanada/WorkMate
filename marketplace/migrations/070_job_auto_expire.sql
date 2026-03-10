-- Migration 070: Job auto-expire
-- Adds expires_at column to jobs table (default: 30 days from creation)
-- Jobs past their expiry are filtered out of public listings at the application layer.

alter table public.jobs
  add column if not exists expires_at timestamptz;

-- Backfill existing open jobs: set expires_at = created_at + 30 days
update public.jobs
  set expires_at = created_at + interval '30 days'
  where expires_at is null
    and status = 'open';

-- Set default for new rows: 30 days from now
alter table public.jobs
  alter column expires_at set default (now() + interval '30 days');

-- Partial index for efficient queries filtering expired open jobs
create index if not exists idx_jobs_expires_at_open
  on public.jobs (expires_at)
  where status = 'open';

comment on column public.jobs.expires_at is 'Auto-expire timestamp — jobs past this date are hidden from public listings (default 30 days from creation)';
