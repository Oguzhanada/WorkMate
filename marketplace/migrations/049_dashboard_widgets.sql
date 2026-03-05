-- Migration 049: Customizable dashboard widgets
-- Stores per-user widget layout and settings for customer/provider/admin dashboards.

create table if not exists public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  widget_type text not null,
  position jsonb not null default '{"x":0,"y":0,"w":4,"h":2}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, widget_type)
);

create index if not exists idx_dashboard_widgets_user_created
  on public.dashboard_widgets(user_id, created_at desc);

alter table public.dashboard_widgets enable row level security;

drop policy if exists dashboard_widgets_select_own on public.dashboard_widgets;
create policy dashboard_widgets_select_own
on public.dashboard_widgets
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists dashboard_widgets_insert_own on public.dashboard_widgets;
create policy dashboard_widgets_insert_own
on public.dashboard_widgets
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists dashboard_widgets_update_own on public.dashboard_widgets;
create policy dashboard_widgets_update_own
on public.dashboard_widgets
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists dashboard_widgets_delete_own on public.dashboard_widgets;
create policy dashboard_widgets_delete_own
on public.dashboard_widgets
for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);
