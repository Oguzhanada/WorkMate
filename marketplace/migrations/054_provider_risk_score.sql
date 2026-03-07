-- Migration 054: Provider risk score and risk flags
-- Adds risk assessment columns to profiles table.
-- risk_score: computed 0–100 (higher = more risky). Default NULL until assessed.
-- risk_flags: jsonb array of flag strings (e.g. ['multiple_accounts', 'payment_disputes']).
-- risk_reviewed_at: when an admin last reviewed this profile's risk.

alter table public.profiles
  add column if not exists risk_score integer check (risk_score is null or risk_score between 0 and 100),
  add column if not exists risk_flags jsonb not null default '[]'::jsonb,
  add column if not exists risk_reviewed_at timestamptz;

-- Partial index: only index profiles that have been risk-assessed (non-null score)
create index if not exists idx_profiles_risk_score
  on public.profiles(risk_score)
  where risk_score is not null;

comment on column public.profiles.risk_score is 'Computed risk score 0–100 (NULL = not assessed). Higher = more risk.';
comment on column public.profiles.risk_flags is 'Array of string flags indicating specific risk signals.';
comment on column public.profiles.risk_reviewed_at is 'When an admin last reviewed this profile for risk.';
