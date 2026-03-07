-- Migration 055: Garda Vetting Status
-- Ireland-specific: providers who work with children or vulnerable adults
-- must have a valid Garda vetting disclosure (National Vetting Bureau).
-- This column tracks the vetting status and expiry date.

alter table public.profiles
  add column if not exists garda_vetting_status text
    check (garda_vetting_status in ('not_required', 'pending', 'approved', 'rejected', 'expired'))
    default 'not_required',
  add column if not exists garda_vetting_reference text
    check (garda_vetting_reference is null or char_length(garda_vetting_reference) <= 100),
  add column if not exists garda_vetting_expires_at date;

-- Index for admin listing of providers with pending/expired vetting
create index if not exists idx_profiles_garda_vetting_status
  on public.profiles(garda_vetting_status)
  where garda_vetting_status in ('pending', 'expired');

comment on column public.profiles.garda_vetting_status is 'Ireland NVB vetting status: not_required | pending | approved | rejected | expired';
comment on column public.profiles.garda_vetting_reference is 'NVB vetting disclosure reference number (admin-assigned)';
comment on column public.profiles.garda_vetting_expires_at is 'Date when the Garda vetting disclosure expires (typically 3 years)';
