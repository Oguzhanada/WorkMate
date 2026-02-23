-- RBAC hardening: dedicated user_roles table + role safety guards

create table if not exists public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

-- Keep user_roles synced from profiles.role
create or replace function public.sync_user_role_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role, created_at, updated_at)
  values (new.id, new.role, now(), now())
  on conflict (user_id)
  do update set role = excluded.role, updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_sync_user_role_from_profile on public.profiles;
create trigger trg_sync_user_role_from_profile
after insert or update of role on public.profiles
for each row execute function public.sync_user_role_from_profile();

-- Backfill
insert into public.user_roles (user_id, role, created_at, updated_at)
select p.id, p.role, now(), now()
from public.profiles p
on conflict (user_id)
do update set role = excluded.role, updated_at = now();

-- Prevent users from escalating their own role
create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and old.id = auth.uid() then
    raise exception 'Changing your role is not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_role_escalation on public.profiles;
create trigger trg_prevent_profile_role_escalation
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

-- Pros can read open jobs (lead pool)
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
