-- WorkMate Airtasker-style feature layer (adapted for existing schema).

-- 1) Reviews expansion (keeps existing reviews table and relationships).
alter table public.reviews
  add column if not exists quality_rating integer,
  add column if not exists communication_rating integer,
  add column if not exists punctuality_rating integer,
  add column if not exists value_rating integer,
  add column if not exists photos text[] not null default '{}',
  add column if not exists provider_response text,
  add column if not exists is_public boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reviews_quality_rating_check'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_quality_rating_check
      check (quality_rating is null or quality_rating between 1 and 5);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'reviews_communication_rating_check'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_communication_rating_check
      check (communication_rating is null or communication_rating between 1 and 5);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'reviews_punctuality_rating_check'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_punctuality_rating_check
      check (punctuality_rating is null or punctuality_rating between 1 and 5);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'reviews_value_rating_check'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_value_rating_check
      check (value_rating is null or value_rating between 1 and 5);
  end if;
end $$;

create index if not exists idx_reviews_pro_id on public.reviews(pro_id);
create index if not exists idx_reviews_is_public on public.reviews(is_public) where is_public = true;

drop policy if exists reviews_select_public on public.reviews;
create policy reviews_select_public
on public.reviews
for select
to authenticated
using (is_public = true);

drop policy if exists reviews_update_provider_response on public.reviews;
create policy reviews_update_provider_response
on public.reviews
for update
to authenticated
using (pro_id = auth.uid())
with check (pro_id = auth.uid());

-- 2) Quotes and jobs metadata.
do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'quote_status'
      and e.enumlabel = 'expired'
  ) then
    -- already exists
    null;
  elsif exists (select 1 from pg_type where typname = 'quote_status') then
    alter type public.quote_status add value 'expired';
  end if;
end $$;

alter table public.quotes
  add column if not exists expires_at timestamptz,
  add column if not exists ranking_score integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'quotes_ranking_score_check'
      and conrelid = 'public.quotes'::regclass
  ) then
    alter table public.quotes
      add constraint quotes_ranking_score_check
      check (ranking_score is null or ranking_score >= 0);
  end if;
end $$;

create index if not exists idx_quotes_expires_at_pending
  on public.quotes(expires_at)
  where status = 'pending';

alter table public.jobs
  add column if not exists task_type text not null default 'in_person',
  add column if not exists job_mode text not null default 'get_quotes';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_task_type_check'
      and conrelid = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_task_type_check
      check (task_type in ('in_person', 'remote', 'flexible'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_job_mode_check'
      and conrelid = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_job_mode_check
      check (job_mode in ('quick_hire', 'direct_request', 'get_quotes'));
  end if;
end $$;

-- 3) Task alerts.
create table if not exists public.task_alerts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  keywords text[] not null default '{}',
  categories uuid[] not null default '{}',
  counties text[] not null default '{}',
  task_types text[] not null default array['in_person'],
  budget_min integer,
  urgency_levels text[] not null default array['asap', 'this_week', 'flexible'],
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_task_alerts_provider_unique
  on public.task_alerts(provider_id);
create index if not exists idx_task_alerts_enabled
  on public.task_alerts(enabled)
  where enabled = true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'task_alerts_budget_min_check'
      and conrelid = 'public.task_alerts'::regclass
  ) then
    alter table public.task_alerts
      add constraint task_alerts_budget_min_check
      check (budget_min is null or budget_min >= 0);
  end if;
end $$;

create or replace function public.set_task_alerts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_task_alerts_updated_at on public.task_alerts;
create trigger trg_task_alerts_updated_at
before update on public.task_alerts
for each row execute function public.set_task_alerts_updated_at();

alter table public.task_alerts enable row level security;

drop policy if exists task_alerts_select_own on public.task_alerts;
create policy task_alerts_select_own
on public.task_alerts
for select
to authenticated
using (
  provider_id = auth.uid()
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

drop policy if exists task_alerts_insert_own on public.task_alerts;
create policy task_alerts_insert_own
on public.task_alerts
for insert
to authenticated
with check (provider_id = auth.uid());

drop policy if exists task_alerts_update_own on public.task_alerts;
create policy task_alerts_update_own
on public.task_alerts
for update
to authenticated
using (provider_id = auth.uid())
with check (provider_id = auth.uid());

drop policy if exists task_alerts_delete_own on public.task_alerts;
create policy task_alerts_delete_own
on public.task_alerts
for delete
to authenticated
using (provider_id = auth.uid());

-- 4) Customer-provider history for rebooking/fees.
create table if not exists public.customer_provider_history (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  jobs_completed integer not null default 0,
  last_job_at timestamptz,
  total_spent_cents integer not null default 0,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(customer_id, provider_id)
);

create index if not exists idx_customer_provider_history_customer
  on public.customer_provider_history(customer_id, updated_at desc);
create index if not exists idx_customer_provider_history_provider
  on public.customer_provider_history(provider_id, updated_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'customer_provider_history_jobs_completed_check'
      and conrelid = 'public.customer_provider_history'::regclass
  ) then
    alter table public.customer_provider_history
      add constraint customer_provider_history_jobs_completed_check
      check (jobs_completed >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'customer_provider_history_total_spent_check'
      and conrelid = 'public.customer_provider_history'::regclass
  ) then
    alter table public.customer_provider_history
      add constraint customer_provider_history_total_spent_check
      check (total_spent_cents >= 0);
  end if;
end $$;

create or replace function public.set_customer_provider_history_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_customer_provider_history_updated_at on public.customer_provider_history;
create trigger trg_customer_provider_history_updated_at
before update on public.customer_provider_history
for each row execute function public.set_customer_provider_history_updated_at();

create or replace function public.increment_customer_history(
  p_customer_id uuid,
  p_provider_id uuid,
  p_price_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customer_provider_history (
    customer_id,
    provider_id,
    jobs_completed,
    last_job_at,
    total_spent_cents
  )
  values (
    p_customer_id,
    p_provider_id,
    1,
    now(),
    greatest(coalesce(p_price_cents, 0), 0)
  )
  on conflict (customer_id, provider_id)
  do update
  set jobs_completed = public.customer_provider_history.jobs_completed + 1,
      total_spent_cents = public.customer_provider_history.total_spent_cents + greatest(coalesce(p_price_cents, 0), 0),
      last_job_at = now(),
      updated_at = now();
end;
$$;

alter table public.customer_provider_history enable row level security;

drop policy if exists customer_provider_history_select_own on public.customer_provider_history;
create policy customer_provider_history_select_own
on public.customer_provider_history
for select
to authenticated
using (
  customer_id = auth.uid()
  or provider_id = auth.uid()
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- 5) Provider rankings materialized view.
drop materialized view if exists public.provider_rankings;
create materialized view public.provider_rankings as
select
  p.id as provider_id,
  coalesce(avg(r.rating)::numeric(4,2), 0) as avg_rating,
  coalesce(count(distinct r.id), 0) as review_count,
  coalesce(count(distinct case when j.status = 'completed' and q_acc.pro_id = p.id then j.id end), 0) as completed_jobs,
  coalesce(
    avg(
      case
        when q_hist.created_at is not null and j_hist.created_at is not null then
          extract(epoch from (q_hist.created_at - j_hist.created_at)) / 3600
        else null
      end
    )::numeric(6,2),
    24
  ) as avg_response_hours,
  case when p.id_verification_status = 'approved' then 5 else 0 end as id_verified_score,
  coalesce(
    (
      select 10
      from public.pro_documents pd
      where pd.profile_id = p.id
        and pd.document_type = 'tax_clearance'
        and pd.verification_status = 'verified'
        and pd.archived_at is null
      limit 1
    ),
    0
  ) as tax_clearance_score,
  coalesce(
    (
      select 10
      from public.pro_documents pd
      where pd.profile_id = p.id
        and pd.document_type = 'public_liability_insurance'
        and pd.verification_status = 'verified'
        and pd.archived_at is null
      limit 1
    ),
    0
  ) as insurance_score,
  coalesce(
    (
      select 5
      from public.pro_documents pd
      where pd.profile_id = p.id
        and pd.document_type = 'safe_pass'
        and pd.verification_status = 'verified'
        and pd.archived_at is null
      limit 1
    ),
    0
  ) as safe_pass_score,
  (
    case when p.id_verification_status = 'approved' then 5 else 0 end
    + coalesce(
        (
          select 10 from public.pro_documents pd
          where pd.profile_id = p.id
            and pd.document_type = 'tax_clearance'
            and pd.verification_status = 'verified'
            and pd.archived_at is null
          limit 1
        ), 0
      )
    + coalesce(
        (
          select 10 from public.pro_documents pd
          where pd.profile_id = p.id
            and pd.document_type = 'public_liability_insurance'
            and pd.verification_status = 'verified'
            and pd.archived_at is null
          limit 1
        ), 0
      )
    + coalesce(
        (
          select 5 from public.pro_documents pd
          where pd.profile_id = p.id
            and pd.document_type = 'safe_pass'
            and pd.verification_status = 'verified'
            and pd.archived_at is null
          limit 1
        ), 0
      )
  ) as total_trust_score
from public.profiles p
left join public.reviews r on r.pro_id = p.id and r.is_public = true
left join public.jobs j on j.status = 'completed'
left join public.quotes q_acc on q_acc.id = j.accepted_quote_id
left join public.quotes q_hist on q_hist.pro_id = p.id
left join public.jobs j_hist on j_hist.id = q_hist.job_id
where exists (
  select 1 from public.user_roles ur
  where ur.user_id = p.id and ur.role = 'verified_pro'
)
group by p.id, p.id_verification_status;

create unique index if not exists idx_provider_rankings_provider_id
  on public.provider_rankings(provider_id);

create or replace function public.refresh_provider_rankings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.provider_rankings;
exception when feature_not_supported then
  -- fallback for environments that do not support concurrent refresh
  refresh materialized view public.provider_rankings;
end;
$$;

-- 6) Scheduled maintenance jobs (if pg_cron is available).
do $$
begin
  if to_regnamespace('cron') is null then
    raise notice 'Skipping local cron jobs: pg_cron is not enabled.';
    return;
  end if;

  perform cron.unschedule(jobid) from cron.job where jobname = 'expire-offers-hourly';
  perform cron.unschedule(jobid) from cron.job where jobname = 'refresh-provider-rankings-nightly';
  perform cron.unschedule(jobid) from cron.job where jobname = 'cleanup-read-notifications-weekly';

  perform cron.schedule(
    'expire-offers-hourly',
    '0 * * * *',
    $job$
      update public.quotes
      set status = 'expired',
          updated_at = now()
      where expires_at < now()
        and status = 'pending';
    $job$
  );

  perform cron.schedule(
    'refresh-provider-rankings-nightly',
    '0 2 * * *',
    'select public.refresh_provider_rankings();'
  );

  perform cron.schedule(
    'cleanup-read-notifications-weekly',
    '0 3 * * 0',
    $job$
      delete from public.notifications
      where created_at < now() - interval '90 days'
        and read_at is not null;
    $job$
  );
end $$;
