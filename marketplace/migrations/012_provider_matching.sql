-- Provider matching model:
-- - category-based: pros only see categories they selected
-- - county-based: pros only see jobs in selected counties (unless Ireland-wide)

create table if not exists public.pro_services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, category_id)
);

create table if not exists public.pro_service_areas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  county text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, county)
);

create index if not exists idx_pro_services_profile on public.pro_services(profile_id);
create index if not exists idx_pro_services_category on public.pro_services(category_id);
create index if not exists idx_pro_areas_profile on public.pro_service_areas(profile_id);
create index if not exists idx_pro_areas_county on public.pro_service_areas(county);

alter table public.pro_services enable row level security;
alter table public.pro_service_areas enable row level security;

drop policy if exists pro_services_select_own on public.pro_services;
create policy pro_services_select_own
on public.pro_services
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists pro_services_insert_own on public.pro_services;
create policy pro_services_insert_own
on public.pro_services
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists pro_services_delete_own on public.pro_services;
create policy pro_services_delete_own
on public.pro_services
for delete
to authenticated
using (profile_id = auth.uid());

drop policy if exists pro_areas_select_own on public.pro_service_areas;
create policy pro_areas_select_own
on public.pro_service_areas
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists pro_areas_insert_own on public.pro_service_areas;
create policy pro_areas_insert_own
on public.pro_service_areas
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists pro_areas_delete_own on public.pro_service_areas;
create policy pro_areas_delete_own
on public.pro_service_areas
for delete
to authenticated
using (profile_id = auth.uid());

alter table public.jobs
  add column if not exists county text,
  add column if not exists locality text;

create index if not exists idx_jobs_county on public.jobs(county);

-- Tighten pro visibility to category+county matched leads.
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

-- Notification trigger: only matched pros should receive new job lead notifications.
create or replace function public.notify_pros_on_new_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
