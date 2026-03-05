-- Migration 049: Provider scheduling and job appointments
-- Adds provider availability definitions and appointment booking workflow with strict RLS.

create table if not exists public.provider_availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week integer check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_recurring boolean not null default true,
  specific_date date,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'provider_availability_end_after_start_check'
      and conrelid = 'public.provider_availability'::regclass
  ) then
    alter table public.provider_availability
      add constraint provider_availability_end_after_start_check
      check (end_time > start_time);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'provider_availability_scope_check'
      and conrelid = 'public.provider_availability'::regclass
  ) then
    alter table public.provider_availability
      add constraint provider_availability_scope_check
      check (
        (is_recurring = true and day_of_week is not null and specific_date is null)
        or (is_recurring = false and day_of_week is null and specific_date is not null)
      );
  end if;
end $$;

create index if not exists idx_provider_availability_provider_day
  on public.provider_availability(provider_id, day_of_week, start_time, end_time)
  where is_recurring = true;

create index if not exists idx_provider_availability_provider_date
  on public.provider_availability(provider_id, specific_date, start_time, end_time)
  where is_recurring = false;

alter table public.provider_availability enable row level security;

drop policy if exists provider_availability_select_scope on public.provider_availability;
create policy provider_availability_select_scope
on public.provider_availability
for select
to authenticated
using (
  provider_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
  or (
    is_recurring = true
    or (specific_date is not null and specific_date >= current_date)
  )
);

drop policy if exists provider_availability_insert_owner_or_admin on public.provider_availability;
create policy provider_availability_insert_owner_or_admin
on public.provider_availability
for insert
to authenticated
with check (
  provider_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists provider_availability_update_owner_or_admin on public.provider_availability;
create policy provider_availability_update_owner_or_admin
on public.provider_availability
for update
to authenticated
using (
  provider_id = auth.uid()
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
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists provider_availability_delete_owner_or_admin on public.provider_availability;
create policy provider_availability_delete_owner_or_admin
on public.provider_availability
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

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'appointments_end_after_start_check'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_end_after_start_check
      check (end_time > start_time);
  end if;
end $$;

create index if not exists idx_appointments_job_start
  on public.appointments(job_id, start_time);

create index if not exists idx_appointments_provider_start
  on public.appointments(provider_id, start_time);

create index if not exists idx_appointments_customer_start
  on public.appointments(customer_id, start_time);

create or replace function public.validate_appointment_schedule()
returns trigger
language plpgsql
as $$
declare
  local_start timestamp;
  local_end timestamp;
begin
  if new.end_time <= new.start_time then
    raise exception 'Appointment end_time must be after start_time';
  end if;

  local_start := new.start_time at time zone 'Europe/Dublin';
  local_end := new.end_time at time zone 'Europe/Dublin';

  if local_start::date <> local_end::date then
    raise exception 'Appointment must start and end on the same calendar day';
  end if;

  if not exists (
    select 1
    from public.jobs j
    join public.quotes q on q.id = j.accepted_quote_id
    where j.id = new.job_id
      and j.customer_id = new.customer_id
      and q.pro_id = new.provider_id
  ) then
    raise exception 'Appointment participants must match the accepted job quote';
  end if;

  if new.status = 'scheduled' then
    if not exists (
      select 1
      from public.provider_availability pa
      where pa.provider_id = new.provider_id
        and (
          (
            pa.is_recurring = true
            and pa.day_of_week = extract(dow from local_start)::integer
            and pa.start_time <= local_start::time
            and pa.end_time >= local_end::time
          )
          or (
            pa.is_recurring = false
            and pa.specific_date = local_start::date
            and pa.start_time <= local_start::time
            and pa.end_time >= local_end::time
          )
        )
    ) then
      raise exception 'Appointment does not fit provider availability';
    end if;

    if exists (
      select 1
      from public.appointments a
      where a.provider_id = new.provider_id
        and a.status = 'scheduled'
        and a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and a.start_time < new.end_time
        and a.end_time > new.start_time
    ) then
      raise exception 'Provider already has a scheduled appointment in this time window';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_appointment_schedule on public.appointments;
create trigger trg_validate_appointment_schedule
before insert or update on public.appointments
for each row execute function public.validate_appointment_schedule();

alter table public.appointments enable row level security;

drop policy if exists appointments_select_participants on public.appointments;
create policy appointments_select_participants
on public.appointments
for select
to authenticated
using (
  provider_id = auth.uid()
  or customer_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists appointments_insert_participants on public.appointments;
create policy appointments_insert_participants
on public.appointments
for insert
to authenticated
with check (
  provider_id = auth.uid()
  or customer_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists appointments_update_participants on public.appointments;
create policy appointments_update_participants
on public.appointments
for update
to authenticated
using (
  provider_id = auth.uid()
  or customer_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
)
with check (
  provider_id = auth.uid()
  or customer_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);
