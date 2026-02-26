-- Auto-release payment support after customer completion confirmation window.

alter table public.jobs
  add column if not exists completed_at timestamptz,
  add column if not exists auto_release_at timestamptz,
  add column if not exists payment_released_at timestamptz,
  add column if not exists release_reminder_sent_at timestamptz;

update public.jobs
set completed_at = coalesce(completed_at, complete_marked_at, now())
where status = 'completed'
  and completed_at is null;

update public.jobs
set auto_release_at = coalesce(auto_release_at, completed_at + interval '14 days')
where status = 'completed'
  and completed_at is not null
  and auto_release_at is null;

alter table public.payments
  add column if not exists auto_release_eligible boolean not null default false,
  add column if not exists auto_release_processed_at timestamptz;

create index if not exists idx_jobs_auto_release_due
  on public.jobs(auto_release_at)
  where status = 'completed'
    and payment_released_at is null
    and auto_release_at is not null;

create index if not exists idx_payments_auto_release
  on public.payments(auto_release_eligible, status, updated_at desc);

create or replace function public.jobs_set_auto_release_dates()
returns trigger
language plpgsql
as $$
declare
  base_completed_at timestamptz;
begin
  if new.status = 'completed' and old.status is distinct from new.status then
    base_completed_at := coalesce(new.completed_at, new.complete_marked_at, now());
    new.completed_at := base_completed_at;
    new.auto_release_at := coalesce(new.auto_release_at, base_completed_at + interval '14 days');
  end if;

  if new.status <> 'completed' then
    new.auto_release_at := null;
    new.payment_released_at := null;
    new.release_reminder_sent_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_jobs_set_auto_release_dates on public.jobs;
create trigger trg_jobs_set_auto_release_dates
before update of status, completed_at, complete_marked_at on public.jobs
for each row
execute function public.jobs_set_auto_release_dates();
