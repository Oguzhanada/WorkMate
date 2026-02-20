-- Auth + RLS hardening for Supabase marketplace

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  requested_status public.verification_status;
begin
  requested_role := case
    when (new.raw_user_meta_data ->> 'role') in ('customer', 'verified_pro', 'admin')
      then (new.raw_user_meta_data ->> 'role')::public.user_role
    else 'customer'::public.user_role
  end;

  requested_status := case
    when requested_role = 'verified_pro' then 'pending'::public.verification_status
    else 'unverified'::public.verification_status
  end;

  insert into public.profiles (
    id,
    role,
    full_name,
    phone,
    verification_status,
    is_verified
  )
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    requested_status,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.quotes enable row level security;
alter table public.reviews enable row level security;

-- profiles policies

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- jobs policies: customer own jobs, pro only related jobs

drop policy if exists jobs_insert_customer_own on public.jobs;
create policy jobs_insert_customer_own
on public.jobs
for insert
to authenticated
with check (customer_id = auth.uid());

drop policy if exists jobs_select_customer_own on public.jobs;
create policy jobs_select_customer_own
on public.jobs
for select
to authenticated
using (customer_id = auth.uid());

drop policy if exists jobs_select_pro_related on public.jobs;
create policy jobs_select_pro_related
on public.jobs
for select
to authenticated
using (
  exists (
    select 1
    from public.quotes q
    where q.job_id = jobs.id
      and q.pro_id = auth.uid()
  )
);

drop policy if exists jobs_update_customer_own on public.jobs;
create policy jobs_update_customer_own
on public.jobs
for update
to authenticated
using (customer_id = auth.uid())
with check (customer_id = auth.uid());

drop policy if exists jobs_delete_customer_own on public.jobs;
create policy jobs_delete_customer_own
on public.jobs
for delete
to authenticated
using (customer_id = auth.uid());

-- quotes policies: pro manages own quotes, customer reads/decides quotes on own jobs

drop policy if exists quotes_insert_pro_own on public.quotes;
create policy quotes_insert_pro_own
on public.quotes
for insert
to authenticated
with check (pro_id = auth.uid());

drop policy if exists quotes_select_pro_own on public.quotes;
create policy quotes_select_pro_own
on public.quotes
for select
to authenticated
using (pro_id = auth.uid());

drop policy if exists quotes_update_pro_own on public.quotes;
create policy quotes_update_pro_own
on public.quotes
for update
to authenticated
using (pro_id = auth.uid())
with check (pro_id = auth.uid());

drop policy if exists quotes_select_customer_job_owner on public.quotes;
create policy quotes_select_customer_job_owner
on public.quotes
for select
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    where j.id = quotes.job_id
      and j.customer_id = auth.uid()
  )
);

drop policy if exists quotes_update_customer_job_owner on public.quotes;
create policy quotes_update_customer_job_owner
on public.quotes
for update
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    where j.id = quotes.job_id
      and j.customer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.jobs j
    where j.id = quotes.job_id
      and j.customer_id = auth.uid()
  )
);

-- reviews policies: customer writes own, pro reads own

drop policy if exists reviews_insert_customer_own on public.reviews;
create policy reviews_insert_customer_own
on public.reviews
for insert
to authenticated
with check (
  customer_id = auth.uid()
  and exists (
    select 1
    from public.jobs j
    where j.id = reviews.job_id
      and j.customer_id = auth.uid()
  )
);

drop policy if exists reviews_select_customer_own on public.reviews;
create policy reviews_select_customer_own
on public.reviews
for select
to authenticated
using (customer_id = auth.uid());

drop policy if exists reviews_select_pro_own on public.reviews;
create policy reviews_select_pro_own
on public.reviews
for select
to authenticated
using (pro_id = auth.uid());
