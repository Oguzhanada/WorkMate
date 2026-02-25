-- Lightweight pro lead management (no paid integrations)

create table if not exists public.pro_lead_actions (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  action text not null check (action in ('saved', 'hidden', 'declined')),
  reason text,
  created_at timestamptz not null default now(),
  unique (pro_id, job_id)
);

create index if not exists idx_pro_lead_actions_pro on public.pro_lead_actions(pro_id, created_at desc);
create index if not exists idx_pro_lead_actions_job on public.pro_lead_actions(job_id);

alter table public.pro_lead_actions enable row level security;

drop policy if exists pro_lead_actions_select_own on public.pro_lead_actions;
create policy pro_lead_actions_select_own
on public.pro_lead_actions
for select
to authenticated
using (pro_id = auth.uid());

drop policy if exists pro_lead_actions_insert_own on public.pro_lead_actions;
create policy pro_lead_actions_insert_own
on public.pro_lead_actions
for insert
to authenticated
with check (pro_id = auth.uid());

drop policy if exists pro_lead_actions_update_own on public.pro_lead_actions;
create policy pro_lead_actions_update_own
on public.pro_lead_actions
for update
to authenticated
using (pro_id = auth.uid())
with check (pro_id = auth.uid());

drop policy if exists pro_lead_actions_delete_own on public.pro_lead_actions;
create policy pro_lead_actions_delete_own
on public.pro_lead_actions
for delete
to authenticated
using (pro_id = auth.uid());
