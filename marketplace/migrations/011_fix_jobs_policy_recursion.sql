-- Fix infinite recursion between jobs and quotes RLS policies.
-- Cause:
--   jobs_select_pro_related -> queries public.quotes
--   quotes_select_customer_job_owner -> queries public.jobs
-- This cycle can trigger "infinite recursion detected in policy for relation jobs".

-- Remove recursive jobs policy from older migration.
drop policy if exists jobs_select_pro_related on public.jobs;

-- Keep pro access simple and non-recursive: verified pros/admins can read open jobs.
drop policy if exists jobs_select_verified_pro_open on public.jobs;
create policy jobs_select_verified_pro_open
on public.jobs
for select
to authenticated
using (
  status = 'open'
  and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('verified_pro', 'admin')
  )
);
