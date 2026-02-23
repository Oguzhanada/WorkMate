-- Guest job intents: allow unauthenticated users to complete wizard,
-- then publish only after account/email verification flow.

create table if not exists public.job_intents (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  title text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  description text not null,
  eircode text not null,
  county text not null,
  locality text not null,
  budget_range text not null,
  photo_urls text[] not null default '{}',
  status text not null default 'email_pending' check (status in ('email_pending', 'ready_to_publish', 'published', 'expired')),
  verification_token text,
  verified_at timestamptz,
  claimed_by uuid references public.profiles(id) on delete set null,
  published_job_id uuid references public.jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_job_intents_email on public.job_intents(email);
create index if not exists idx_job_intents_status on public.job_intents(status);
create unique index if not exists idx_job_intents_verification_token on public.job_intents(verification_token) where verification_token is not null;

alter table public.job_intents enable row level security;

-- Intents are managed by backend route handlers (service role).
drop policy if exists job_intents_select_none on public.job_intents;
create policy job_intents_select_none
on public.job_intents
for select
to authenticated
using (false);
