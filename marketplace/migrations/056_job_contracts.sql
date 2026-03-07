-- Migration 056: Job Contracts
-- A lightweight contract record between customer and provider on an accepted job.
-- Tracks terms, signatures, and status.

create table if not exists public.job_contracts (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid not null references public.jobs(id) on delete cascade,
  quote_id            uuid references public.quotes(id) on delete set null,
  customer_id         uuid not null references public.profiles(id) on delete cascade,
  provider_id         uuid not null references public.profiles(id) on delete cascade,
  terms               text not null check (char_length(terms) between 10 and 10000),
  status              text not null default 'draft'
    check (status in ('draft', 'sent', 'signed_customer', 'signed_provider', 'signed_both', 'voided')),
  customer_signed_at  timestamptz,
  provider_signed_at  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (job_id)
);

-- Auto-update updated_at
create or replace function public.set_job_contracts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_job_contracts_updated_at on public.job_contracts;
create trigger trg_job_contracts_updated_at
  before update on public.job_contracts
  for each row execute function public.set_job_contracts_updated_at();

-- Auto-resolve status when both parties sign
create or replace function public.resolve_contract_status()
returns trigger language plpgsql as $$
begin
  if new.customer_signed_at is not null and new.provider_signed_at is not null then
    new.status = 'signed_both';
  elsif new.customer_signed_at is not null and new.provider_signed_at is null then
    new.status = 'signed_customer';
  elsif new.provider_signed_at is not null and new.customer_signed_at is null then
    new.status = 'signed_provider';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_resolve_contract_status on public.job_contracts;
create trigger trg_resolve_contract_status
  before update on public.job_contracts
  for each row execute function public.resolve_contract_status();

-- Indexes
create index if not exists idx_job_contracts_job_id
  on public.job_contracts(job_id);
create index if not exists idx_job_contracts_customer
  on public.job_contracts(customer_id);
create index if not exists idx_job_contracts_provider
  on public.job_contracts(provider_id);

-- RLS
alter table public.job_contracts enable row level security;

create policy "Participants can view their own contracts"
  on public.job_contracts
  for select
  using (auth.uid() = customer_id or auth.uid() = provider_id);

create policy "Customer can create contract"
  on public.job_contracts
  for insert
  with check (auth.uid() = customer_id);

create policy "Participants can update contract"
  on public.job_contracts
  for update
  using (auth.uid() = customer_id or auth.uid() = provider_id);

create policy "Admins can view all contracts"
  on public.job_contracts
  for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
      and ur.role = 'admin'
    )
  );
