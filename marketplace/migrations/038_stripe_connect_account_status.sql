-- Track Stripe Connect account health flags synced via account.updated webhook.

alter table public.profiles
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false;

create index if not exists idx_profiles_stripe_account_id
  on public.profiles(stripe_account_id)
  where stripe_account_id is not null;
