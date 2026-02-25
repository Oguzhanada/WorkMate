-- Multi-role RBAC: allow one user to hold multiple roles simultaneously.
-- Example: customer + verified_pro.

-- Remove old single-role sync trigger (it overwrites roles).
drop trigger if exists trg_sync_user_role_from_profile on public.profiles;
drop function if exists public.sync_user_role_from_profile();

-- Convert user_roles PK from single user_id to composite (user_id, role).
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'user_roles'
      and constraint_name = 'user_roles_pkey'
  ) then
    alter table public.user_roles drop constraint user_roles_pkey;
  end if;
end $$;

alter table public.user_roles
  add constraint user_roles_pkey primary key (user_id, role);

-- Ensure every profile has at least customer role.
insert into public.user_roles (user_id, role, created_at, updated_at)
select p.id, 'customer'::public.user_role, now(), now()
from public.profiles p
on conflict (user_id, role) do nothing;

-- Preserve legacy profile.role assignments as additional roles.
insert into public.user_roles (user_id, role, created_at, updated_at)
select p.id, p.role, now(), now()
from public.profiles p
where p.role <> 'customer'
on conflict (user_id, role) do nothing;

-- Keep default customer role on new profile inserts.
create or replace function public.ensure_customer_role_on_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role, created_at, updated_at)
  values (new.id, 'customer', now(), now())
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_customer_role_on_profile_insert on public.profiles;
create trigger trg_ensure_customer_role_on_profile_insert
after insert on public.profiles
for each row execute function public.ensure_customer_role_on_profile_insert();
