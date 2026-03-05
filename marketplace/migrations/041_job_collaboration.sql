-- Job collaboration layer: extend job_messages + add job_todos

-- ──────────────────────────────────────────────
-- 1. Extend job_messages with file/type support
-- ──────────────────────────────────────────────

alter table public.job_messages
  add column if not exists message_type text not null default 'text'
    check (message_type in ('text', 'file', 'system')),
  add column if not exists file_url text,
  add column if not exists file_name text;

-- ──────────────────────────────────────────────
-- 2. Job to-do list
-- ──────────────────────────────────────────────

create table if not exists public.job_todos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  completed boolean not null default false,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_todos_job on public.job_todos(job_id, created_at);

alter table public.job_todos enable row level security;

-- ── SELECT: job customer or accepted-quote pro, or admin ──
drop policy if exists job_todos_select_participants on public.job_todos;
create policy job_todos_select_participants
on public.job_todos
for select
to authenticated
using (
  exists (
    select 1 from public.jobs j
    where j.id = job_todos.job_id
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
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- ── INSERT: same participants ──
drop policy if exists job_todos_insert_participants on public.job_todos;
create policy job_todos_insert_participants
on public.job_todos
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    exists (
      select 1 from public.jobs j
      where j.id = job_todos.job_id
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
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
);

-- ── UPDATE: same participants ──
drop policy if exists job_todos_update_participants on public.job_todos;
create policy job_todos_update_participants
on public.job_todos
for update
to authenticated
using (
  exists (
    select 1 from public.jobs j
    where j.id = job_todos.job_id
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
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- ── DELETE: creator or admin only ──
drop policy if exists job_todos_delete_creator on public.job_todos;
create policy job_todos_delete_creator
on public.job_todos
for delete
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- ──────────────────────────────────────────────
-- 3. Storage bucket for job file attachments
--    Run in Supabase dashboard (Storage > New bucket):
--      name: job-files
--      public: false
--      file size limit: 10 MB
--    Storage RLS is controlled via Supabase dashboard policies.
-- ──────────────────────────────────────────────
