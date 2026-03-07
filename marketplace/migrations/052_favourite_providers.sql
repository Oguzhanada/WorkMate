-- Migration 052: Favourite Providers
-- Customers can save/unsave providers they like.
-- RLS: customers can only read/write their own rows.

create table if not exists public.favourite_providers (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.profiles(id) on delete cascade,
  provider_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (customer_id, provider_id)
);

-- Index for fast lookup by customer
create index if not exists idx_favourite_providers_customer
  on public.favourite_providers(customer_id);

-- RLS
alter table public.favourite_providers enable row level security;

create policy "Customers can view their own favourites"
  on public.favourite_providers
  for select
  using (auth.uid() = customer_id);

create policy "Customers can add favourites"
  on public.favourite_providers
  for insert
  with check (auth.uid() = customer_id);

create policy "Customers can remove their own favourites"
  on public.favourite_providers
  for delete
  using (auth.uid() = customer_id);
