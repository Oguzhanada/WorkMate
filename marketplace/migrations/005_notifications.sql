-- Basic notification infrastructure for pro leads and customer quote updates

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.notify_pros_on_new_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, payload)
  select ur.user_id,
         'new_job_lead',
         jsonb_build_object(
           'job_id', new.id,
           'title', new.title,
           'category', new.category,
           'eircode', new.eircode
         )
  from public.user_roles ur
  where ur.role in ('verified_pro', 'admin')
    and ur.user_id <> new.customer_id;

  return new;
end;
$$;

drop trigger if exists trg_notify_pros_on_new_job on public.jobs;
create trigger trg_notify_pros_on_new_job
after insert on public.jobs
for each row execute function public.notify_pros_on_new_job();

create or replace function public.notify_customer_on_new_quote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select j.customer_id into owner_id
  from public.jobs j
  where j.id = new.job_id;

  if owner_id is not null then
    insert into public.notifications (user_id, type, payload)
    values (
      owner_id,
      'new_quote',
      jsonb_build_object(
        'quote_id', new.id,
        'job_id', new.job_id,
        'pro_id', new.pro_id,
        'quote_amount_cents', new.quote_amount_cents
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_customer_on_new_quote on public.quotes;
create trigger trg_notify_customer_on_new_quote
after insert on public.quotes
for each row execute function public.notify_customer_on_new_quote();
