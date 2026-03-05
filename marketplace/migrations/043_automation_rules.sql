-- 043_automation_rules.sql
-- Workflow / automation rules engine — admin-only CRUD, service-client execution

create table if not exists public.automation_rules (
  id           uuid        primary key default gen_random_uuid(),
  trigger_event text       not null check (
    trigger_event in (
      'document_verified',
      'document_rejected',
      'job_created',
      'quote_received',
      'job_inactive',
      'provider_approved'
    )
  ),
  conditions   jsonb       not null default '{}'::jsonb,
  action_type  text        not null check (
    action_type in ('send_notification', 'change_status', 'create_task')
  ),
  action_config jsonb      not null default '{}'::jsonb,
  enabled      boolean     not null default true,
  created_by   uuid        references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_automation_rules_event_enabled
  on public.automation_rules(trigger_event, enabled);

alter table public.automation_rules enable row level security;

-- Only admins can read automation rules
drop policy if exists automation_rules_admin_select on public.automation_rules;
create policy automation_rules_admin_select
  on public.automation_rules for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- Only admins can create rules
drop policy if exists automation_rules_admin_insert on public.automation_rules;
create policy automation_rules_admin_insert
  on public.automation_rules for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- Only admins can update rules
drop policy if exists automation_rules_admin_update on public.automation_rules;
create policy automation_rules_admin_update
  on public.automation_rules for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- Only admins can delete rules
drop policy if exists automation_rules_admin_delete on public.automation_rules;
create policy automation_rules_admin_delete
  on public.automation_rules for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );
