-- Job approval flow without breaking existing job lifecycle enum.
-- Keep public.job_status enum as-is; add review_status layer.

alter table public.jobs
  add column if not exists review_status text not null default 'pending_review',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists rejection_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_review_status_check'
      and conrelid = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_review_status_check
      check (review_status in ('pending_review', 'approved', 'rejected'));
  end if;
end $$;

-- Existing live jobs become approved (equivalent to previous "open is visible" behavior).
update public.jobs
set review_status = 'approved'
where review_status is null
   or review_status = 'pending_review';

create index if not exists idx_jobs_review_status
  on public.jobs(review_status);

create index if not exists idx_jobs_pending_review_created
  on public.jobs(review_status, created_at desc)
  where review_status = 'pending_review';

-- Pros see only approved open jobs.
drop policy if exists jobs_select_verified_pro_open on public.jobs;
create policy jobs_select_verified_pro_open
on public.jobs
for select
to authenticated
using (
  status = 'open'
  and review_status = 'approved'
  and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('verified_pro', 'admin')
  )
  and exists (
    select 1
    from public.pro_services ps
    where ps.profile_id = auth.uid()
      and ps.category_id = jobs.category_id
  )
  and (
    exists (
      select 1
      from public.pro_service_areas pa_all
      where pa_all.profile_id = auth.uid()
        and pa_all.county = 'Ireland-wide'
    )
    or exists (
      select 1
      from public.pro_service_areas pa
      where pa.profile_id = auth.uid()
        and pa.county = jobs.county
    )
  )
);

-- Admin can review non-approved jobs (pending/rejected).
drop policy if exists jobs_select_admin_review_queue on public.jobs;
create policy jobs_select_admin_review_queue
on public.jobs
for select
to authenticated
using (
  review_status in ('pending_review', 'rejected')
  and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

-- Notify matched pros only when a job is actually approved and open.
create or replace function public.notify_pros_on_new_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'open' or new.review_status <> 'approved' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'open' and old.review_status = 'approved' then
    return new;
  end if;

  insert into public.notifications (user_id, type, payload)
  select distinct ur.user_id,
         'new_job_lead',
         jsonb_build_object(
           'job_id', new.id,
           'title', new.title,
           'category', new.category,
           'category_id', new.category_id,
           'county', new.county,
           'eircode', new.eircode
         )
  from public.user_roles ur
  join public.pro_services ps
    on ps.profile_id = ur.user_id
   and ps.category_id = new.category_id
  join public.pro_service_areas pa
    on pa.profile_id = ur.user_id
   and (pa.county = new.county or pa.county = 'Ireland-wide')
  where ur.role in ('verified_pro', 'admin')
    and ur.user_id <> new.customer_id;

  return new;
end;
$$;

drop trigger if exists trg_notify_pros_on_new_job on public.jobs;
create trigger trg_notify_pros_on_new_job
after insert or update of review_status, status on public.jobs
for each row execute function public.notify_pros_on_new_job();
