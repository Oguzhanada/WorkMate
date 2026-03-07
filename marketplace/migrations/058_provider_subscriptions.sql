-- Migration 058: Provider Subscriptions
-- Tracks provider subscription plans (basic, professional, premium).
-- Linked to Stripe subscription IDs for billing.

create table if not exists public.provider_subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  provider_id             uuid not null references public.profiles(id) on delete cascade,
  plan                    text not null default 'basic'
    check (plan in ('basic', 'professional', 'premium')),
  status                  text not null default 'active'
    check (status in ('active', 'past_due', 'cancelled', 'trialing', 'paused')),
  stripe_subscription_id  text unique,
  stripe_customer_id      text,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (provider_id)
);

-- Auto-update updated_at
create or replace function public.set_provider_subscriptions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_provider_subscriptions_updated_at on public.provider_subscriptions;
create trigger trg_provider_subscriptions_updated_at
  before update on public.provider_subscriptions
  for each row execute function public.set_provider_subscriptions_updated_at();

create index if not exists idx_provider_subscriptions_provider
  on public.provider_subscriptions(provider_id);

create index if not exists idx_provider_subscriptions_stripe
  on public.provider_subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

-- RLS
alter table public.provider_subscriptions enable row level security;

create policy "Providers can view their own subscription"
  on public.provider_subscriptions
  for select
  using (auth.uid() = provider_id);

create policy "Admins can view all subscriptions"
  on public.provider_subscriptions
  for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
      and ur.role = 'admin'
    )
  );

create policy "Service role manages subscriptions"
  on public.provider_subscriptions
  for all
  using (true)
  with check (true);

comment on column public.provider_subscriptions.plan is 'Subscription tier: basic (free) | professional | premium';
comment on column public.provider_subscriptions.stripe_subscription_id is 'Stripe subscription ID for paid plans';
comment on column public.provider_subscriptions.cancel_at_period_end is 'True if the provider cancelled but access continues until period end';
