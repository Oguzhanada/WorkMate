-- Migration 039: Direct Request flow + job mode infrastructure
-- Adds target_provider_id for direct_request jobs and indexes for mode-based queries.

-- Add target_provider_id: the specific provider a customer is directing the job to.
-- Only relevant when job_mode = 'direct_request'. Null for quick_hire and get_quotes.
alter table public.jobs
  add column if not exists target_provider_id uuid references public.profiles(id) on delete set null;

-- Index for provider dashboard: "which jobs are directed at me?"
create index if not exists idx_jobs_target_provider_id
  on public.jobs(target_provider_id)
  where target_provider_id is not null;

-- Index for filtering by mode (used in provider browse + dashboard queries)
create index if not exists idx_jobs_job_mode
  on public.jobs(job_mode);

-- RLS: target provider can read their directed jobs even before they are public.
-- (They still can't see the full list; just jobs targeted at them.)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Target provider can read directed jobs'
  ) then
    create policy "Target provider can read directed jobs"
      on public.jobs for select
      using (target_provider_id = auth.uid());
  end if;
end $$;
