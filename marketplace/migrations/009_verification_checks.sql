-- AI/manual verification check records for provider onboarding

create table if not exists public.verification_checks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  risk_score numeric(5,4) not null check (risk_score >= 0 and risk_score <= 1),
  summary text,
  signals jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_verification_checks_profile_created
  on public.verification_checks(profile_id, created_at desc);

alter table public.verification_checks enable row level security;

drop policy if exists verification_checks_select_admin on public.verification_checks;
create policy verification_checks_select_admin
on public.verification_checks
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists verification_checks_insert_admin on public.verification_checks;
create policy verification_checks_insert_admin
on public.verification_checks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);
