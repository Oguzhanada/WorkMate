-- Dispute management system.

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'cancelled')),
  dispute_type text not null check (dispute_type in ('quality_issue', 'non_completion', 'damage', 'no_show', 'other')),
  customer_claim text not null,
  provider_response text,
  admin_notes text,
  payment_intent_id text,
  payment_status text not null default 'on_hold' check (payment_status in ('on_hold', 'released_to_provider', 'refunded_to_customer', 'split')),
  resolution_deadline timestamptz not null default (now() + interval '7 days'),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution_type text check (resolution_type in ('full_refund', 'partial_refund', 'full_payment', 'custom')),
  resolution_amount_cents integer check (resolution_amount_cents is null or resolution_amount_cents >= 0),
  stale_notified_at timestamptz,
  unique (job_id, status) deferrable initially immediate
);

-- Allow multiple historical disputes by dropping strict unique when status differs.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'disputes_job_id_status_key'
      and conrelid = 'public.disputes'::regclass
  ) then
    alter table public.disputes drop constraint disputes_job_id_status_key;
  end if;
end $$;

create unique index if not exists uq_disputes_job_active
  on public.disputes(job_id)
  where status in ('open', 'under_review');

create table if not exists public.dispute_logs (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  created_at timestamptz not null default now(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  actor_role text not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  old_status text,
  new_status text
);

create table if not exists public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  uploaded_at timestamptz not null default now(),
  file_url text not null,
  file_type text not null,
  description text
);

alter table public.jobs
  add column if not exists dispute_deadline timestamptz,
  add column if not exists payment_on_hold boolean not null default false;

create or replace function public.jobs_set_dispute_deadline()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and (old.status is distinct from new.status or old.complete_marked_at is distinct from new.complete_marked_at) then
    new.dispute_deadline := coalesce(new.complete_marked_at, now()) + interval '14 days';
  elsif new.status <> 'completed' then
    new.dispute_deadline := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_jobs_set_dispute_deadline on public.jobs;
create trigger trg_jobs_set_dispute_deadline
before update of status, complete_marked_at on public.jobs
for each row
execute function public.jobs_set_dispute_deadline();

update public.jobs
set dispute_deadline = coalesce(complete_marked_at, created_at) + interval '14 days'
where status = 'completed'
  and dispute_deadline is null;

create index if not exists idx_disputes_job_id on public.disputes(job_id);
create index if not exists idx_disputes_status on public.disputes(status);
create index if not exists idx_disputes_resolution_deadline
  on public.disputes(resolution_deadline)
  where status in ('open', 'under_review');
create index if not exists idx_dispute_logs_dispute_id_created_at
  on public.dispute_logs(dispute_id, created_at desc);
create index if not exists idx_dispute_evidence_dispute_id_uploaded_at
  on public.dispute_evidence(dispute_id, uploaded_at desc);

alter table public.disputes enable row level security;
alter table public.dispute_logs enable row level security;
alter table public.dispute_evidence enable row level security;

drop policy if exists disputes_select_participant_or_admin on public.disputes;
create policy disputes_select_participant_or_admin
on public.disputes
for select
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.jobs j
    where j.id = disputes.job_id
      and (
        j.customer_id = auth.uid()
        or exists (
          select 1 from public.quotes q
          where q.id = j.accepted_quote_id
            and q.pro_id = auth.uid()
        )
      )
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists disputes_insert_participant on public.disputes;
create policy disputes_insert_participant
on public.disputes
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.jobs j
    where j.id = disputes.job_id
      and (
        j.customer_id = auth.uid()
        or exists (
          select 1 from public.quotes q
          where q.id = j.accepted_quote_id
            and q.pro_id = auth.uid()
        )
      )
  )
);

drop policy if exists disputes_update_admin_or_creator on public.disputes;
create policy disputes_update_admin_or_creator
on public.disputes
for update
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
)
with check (
  created_by = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists dispute_logs_select_participant_or_admin on public.dispute_logs;
create policy dispute_logs_select_participant_or_admin
on public.dispute_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.disputes d
    join public.jobs j on j.id = d.job_id
    where d.id = dispute_logs.dispute_id
      and (
        d.created_by = auth.uid()
        or j.customer_id = auth.uid()
        or exists (
          select 1 from public.quotes q
          where q.id = j.accepted_quote_id
            and q.pro_id = auth.uid()
        )
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.role = 'admin'
        )
      )
  )
);

drop policy if exists dispute_logs_insert_actor on public.dispute_logs;
create policy dispute_logs_insert_actor
on public.dispute_logs
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.disputes d
    join public.jobs j on j.id = d.job_id
    where d.id = dispute_logs.dispute_id
      and (
        d.created_by = auth.uid()
        or j.customer_id = auth.uid()
        or exists (
          select 1 from public.quotes q
          where q.id = j.accepted_quote_id
            and q.pro_id = auth.uid()
        )
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.role = 'admin'
        )
      )
  )
);

drop policy if exists dispute_evidence_select_participant_or_admin on public.dispute_evidence;
create policy dispute_evidence_select_participant_or_admin
on public.dispute_evidence
for select
to authenticated
using (
  exists (
    select 1
    from public.disputes d
    join public.jobs j on j.id = d.job_id
    where d.id = dispute_evidence.dispute_id
      and (
        d.created_by = auth.uid()
        or j.customer_id = auth.uid()
        or exists (
          select 1 from public.quotes q
          where q.id = j.accepted_quote_id
            and q.pro_id = auth.uid()
        )
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.role = 'admin'
        )
      )
  )
);

drop policy if exists dispute_evidence_insert_participant on public.dispute_evidence;
create policy dispute_evidence_insert_participant
on public.dispute_evidence
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.disputes d
    join public.jobs j on j.id = d.job_id
    where d.id = dispute_evidence.dispute_id
      and (
        d.created_by = auth.uid()
        or j.customer_id = auth.uid()
        or exists (
          select 1 from public.quotes q
          where q.id = j.accepted_quote_id
            and q.pro_id = auth.uid()
        )
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.role = 'admin'
        )
      )
  )
);
