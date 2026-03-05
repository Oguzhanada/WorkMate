-- 044_automation_rules_cron.sql
-- pg_cron scheduled function that fires 'job_inactive' automation notifications
-- Requires: pg_cron extension enabled in Supabase dashboard (Extensions → pg_cron)
-- Depends on: 043_automation_rules.sql

-- Function scans open jobs with no quotes submitted in the last 7 days,
-- then notifies all admins so they can follow up with the customer.
create or replace function public.fire_job_inactive_automations()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  job_record record;
begin
  -- Early exit if no job_inactive rules are enabled
  if not exists (
    select 1 from public.automation_rules
    where trigger_event = 'job_inactive' and enabled = true
  ) then
    return;
  end if;

  -- Find open, approved jobs older than 7 days with no recent quotes
  for job_record in
    select j.id as job_id,
           j.customer_id,
           j.category,
           j.title
    from public.jobs j
    where j.status = 'open'
      and j.review_status = 'approved'
      and j.created_at <= now() - interval '7 days'
      and not exists (
        select 1 from public.quotes q
        where q.job_id = j.id
          and q.created_at >= now() - interval '7 days'
      )
  loop
    insert into public.notifications (user_id, type, payload)
    select ur.user_id,
           'automation_job_inactive',
           jsonb_build_object(
             'job_id',      job_record.job_id,
             'job_title',   job_record.title,
             'category',    job_record.category,
             'customer_id', job_record.customer_id,
             'trigger',     'job_inactive',
             'fired_at',    now()
           )
    from public.user_roles ur
    where ur.role = 'admin';
  end loop;
end;
$$;

-- Schedule: every 6 hours
-- Unschedule first to avoid duplicate registrations on re-run
select cron.unschedule('automation-job-inactive-check')
where exists (
  select 1 from cron.job where jobname = 'automation-job-inactive-check'
);

select cron.schedule(
  'automation-job-inactive-check',
  '0 */6 * * *',
  $$ select public.fire_job_inactive_automations(); $$
);
