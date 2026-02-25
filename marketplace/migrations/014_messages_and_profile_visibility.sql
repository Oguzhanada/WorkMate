-- Messaging model for jobs: public comments + private quote chat

create table if not exists public.job_messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  visibility text not null check (visibility in ('public', 'private')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_messages_job on public.job_messages(job_id, created_at desc);
create index if not exists idx_job_messages_quote on public.job_messages(quote_id, created_at desc);
create index if not exists idx_job_messages_receiver on public.job_messages(receiver_id, created_at desc);

alter table public.job_messages enable row level security;

drop policy if exists job_messages_select_public on public.job_messages;
create policy job_messages_select_public
on public.job_messages
for select
to authenticated
using (
  visibility = 'public'
  and exists (
    select 1
    from public.jobs j
    where j.id = job_messages.job_id
      and j.status in ('open', 'quoted', 'accepted', 'in_progress')
  )
);

drop policy if exists job_messages_select_private_participants on public.job_messages;
create policy job_messages_select_private_participants
on public.job_messages
for select
to authenticated
using (
  visibility = 'private'
  and (sender_id = auth.uid() or receiver_id = auth.uid())
);

drop policy if exists job_messages_insert_public on public.job_messages;
create policy job_messages_insert_public
on public.job_messages
for insert
to authenticated
with check (
  visibility = 'public'
  and sender_id = auth.uid()
  and receiver_id is null
  and exists (
    select 1
    from public.jobs j
    where j.id = job_messages.job_id
      and j.status in ('open', 'quoted', 'accepted', 'in_progress')
  )
);

drop policy if exists job_messages_insert_private_participants on public.job_messages;
create policy job_messages_insert_private_participants
on public.job_messages
for insert
to authenticated
with check (
  visibility = 'private'
  and sender_id = auth.uid()
  and receiver_id is not null
  and quote_id is not null
  and exists (
    select 1
    from public.quotes q
    join public.jobs j on j.id = q.job_id
    where q.id = job_messages.quote_id
      and q.job_id = job_messages.job_id
      and (
        (j.customer_id = auth.uid() and q.pro_id = job_messages.receiver_id)
        or (q.pro_id = auth.uid() and j.customer_id = job_messages.receiver_id)
      )
  )
);

-- Allow customers to see minimal profile names of pros who quoted their jobs,
-- and pros to see customer names for jobs they quoted.
drop policy if exists profiles_select_for_related_quotes on public.profiles;
create policy profiles_select_for_related_quotes
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    join public.quotes q on q.job_id = j.id
    where j.customer_id = auth.uid()
      and q.pro_id = profiles.id
  )
  or exists (
    select 1
    from public.quotes q
    join public.jobs j on j.id = q.job_id
    where q.pro_id = auth.uid()
      and j.customer_id = profiles.id
  )
);
