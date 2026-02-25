-- 1) Rich quote details for transparent offers
alter table public.quotes
  add column if not exists estimated_duration text,
  add column if not exists includes text[] not null default '{}',
  add column if not exists excludes text[] not null default '{}';

-- 2) Provider portfolio for trust signals (before/after)
create table if not exists public.pro_portfolio (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null default '',
  before_image_url text not null,
  after_image_url text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_pro_portfolio_profile on public.pro_portfolio(profile_id, created_at desc);
create index if not exists idx_pro_portfolio_category on public.pro_portfolio(category_id);

alter table public.pro_portfolio enable row level security;

drop policy if exists pro_portfolio_select_public_or_owner on public.pro_portfolio;
create policy pro_portfolio_select_public_or_owner
on public.pro_portfolio
for select
to authenticated
using (
  is_public = true
  or profile_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists pro_portfolio_insert_own on public.pro_portfolio;
create policy pro_portfolio_insert_own
on public.pro_portfolio
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('verified_pro', 'admin')
  )
);

drop policy if exists pro_portfolio_update_own on public.pro_portfolio;
create policy pro_portfolio_update_own
on public.pro_portfolio
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists pro_portfolio_delete_own on public.pro_portfolio;
create policy pro_portfolio_delete_own
on public.pro_portfolio
for delete
to authenticated
using (profile_id = auth.uid());
