-- Migration 057: Feature Flags
-- Enables toggling platform features without code deploys.
-- Flags can target all users, specific roles, or specific profile IDs.

create table if not exists public.feature_flags (
  id              uuid primary key default gen_random_uuid(),
  flag_key        text not null unique check (char_length(flag_key) between 2 and 100),
  description     text not null default '' check (char_length(description) <= 400),
  enabled         boolean not null default false,
  enabled_for_roles text[] not null default '{}',   -- e.g. '{admin}', '{verified_pro,admin}'
  enabled_for_ids uuid[] not null default '{}',     -- specific profile IDs
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_feature_flags_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_feature_flags_updated_at on public.feature_flags;
create trigger trg_feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.set_feature_flags_updated_at();

-- Seed initial flags
insert into public.feature_flags (flag_key, description, enabled, enabled_for_roles) values
  ('ai_job_description', 'AI-powered job description writer in post-job form', true, '{}'),
  ('same_day_badge', 'Same-day availability badge on provider cards and offer cards', true, '{}'),
  ('price_estimate_hint', 'Price estimation hint based on historical accepted quotes', true, '{}'),
  ('garda_vetting_badge', 'Show Garda vetting status badge on provider profiles', true, '{}'),
  ('job_contracts', 'Enable contract creation and signing on jobs', false, '{admin}'),
  ('provider_risk_score', 'Show risk score in admin provider applications', false, '{admin}')
on conflict (flag_key) do nothing;

-- RLS: admins can manage, everyone can read enabled flags
alter table public.feature_flags enable row level security;

create policy "Anyone can read enabled feature flags"
  on public.feature_flags
  for select
  using (enabled = true);

create policy "Admins can read all feature flags"
  on public.feature_flags
  for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
      and ur.role = 'admin'
    )
  );

create policy "Admins can manage feature flags"
  on public.feature_flags
  for all
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
      and ur.role = 'admin'
    )
  );
