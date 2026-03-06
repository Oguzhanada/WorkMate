-- Migration 050: Irish Compliance Score System
-- Adds a compliance_score (0-100) to profiles and auto-calculates it via triggers.

-- 1. Add column to profiles
alter table public.profiles
  add column if not exists compliance_score integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_compliance_score_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_compliance_score_check
      check (compliance_score >= 0 and compliance_score <= 100);
  end if;
end $$;

-- 2. Create the calculation function
create or replace function public.calculate_compliance_score(p_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score integer := 0;
  v_profile record;
  v_has_insurance boolean;
  v_has_safe_pass boolean;
  v_has_tax_clearance boolean;
begin
  -- Get base profile verification statuses
  select id_verification_status, verification_status
  into v_profile
  from public.profiles
  where id = p_profile_id;

  if not found then
    return 0;
  end if;

  -- 30 pts: Stripe Identity / ID Verification
  if v_profile.id_verification_status = 'approved' then
    v_score := v_score + 30;
  end if;

  -- 10 pts: Manual Admin Business Verification approval
  if v_profile.verification_status = 'verified' then
    v_score := v_score + 10;
  end if;

  -- 20 pts: Valid Public Liability Insurance
  select exists (
    select 1 from public.pro_documents
    where profile_id = p_profile_id
      and document_type = 'public_liability_insurance'
      and verification_status = 'verified'
      and (archived_at is null)
  ) into v_has_insurance;

  if v_has_insurance then
    v_score := v_score + 20;
  end if;

  -- 20 pts: Valid Safe Pass
  select exists (
    select 1 from public.pro_documents
    where profile_id = p_profile_id
      and document_type = 'safe_pass'
      and verification_status = 'verified'
      and (archived_at is null)
  ) into v_has_safe_pass;

  if v_has_safe_pass then
    v_score := v_score + 20;
  end if;

  -- 20 pts: Valid Tax Clearance
  select exists (
    select 1 from public.pro_documents
    where profile_id = p_profile_id
      and document_type = 'tax_clearance'
      and verification_status = 'verified'
      and (archived_at is null)
  ) into v_has_tax_clearance;

  if v_has_tax_clearance then
    v_score := v_score + 20;
  end if;

  return v_score;
end;
$$;

-- 3. Trigger functions to auto-update score
create or replace function public.trg_update_profile_compliance_score()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only recalculate if verification status changes
  if (tg_op = 'UPDATE') then
    if (new.id_verification_status is distinct from old.id_verification_status) or
       (new.verification_status is distinct from old.verification_status) then
      new.compliance_score := public.calculate_compliance_score(new.id);
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.trg_update_docs_compliance_score()
returns trigger
language plpgsql
security definer
as $$
declare
  v_profile_id uuid;
begin
  if (tg_op = 'DELETE') then
    v_profile_id := old.profile_id;
  else
    v_profile_id := new.profile_id;
  end if;

  -- Disallow trigger loop by updating directly
  update public.profiles
  set compliance_score = public.calculate_compliance_score(v_profile_id)
  where id = v_profile_id;

  if (tg_op = 'DELETE') then return old; else return new; end if;
end;
$$;

-- 4. Attach triggers
drop trigger if exists trg_profiles_compliance_score on public.profiles;
create trigger trg_profiles_compliance_score
before update on public.profiles
for each row execute function public.trg_update_profile_compliance_score();

drop trigger if exists trg_pro_docs_compliance_score on public.pro_documents;
create trigger trg_pro_docs_compliance_score
after insert or update or delete on public.pro_documents
for each row execute function public.trg_update_docs_compliance_score();

-- 5. Backfill existing data
do $$
declare
  r record;
begin
  for r in select id from public.profiles where role = 'verified_pro' loop
    update public.profiles
    set compliance_score = public.calculate_compliance_score(r.id)
    where id = r.id;
  end loop;
end $$;

-- 6. Update provider_rankings materialized view to include compliance_score
drop materialized view if exists public.provider_rankings;
create materialized view public.provider_rankings as
select
  p.id as provider_id,
  p.compliance_score,
  coalesce(avg(r.rating)::numeric(4,2), 0) as avg_rating,
  coalesce(count(distinct r.id), 0) as review_count,
  coalesce(count(distinct case when j.status = 'completed' and q_acc.pro_id = p.id then j.id end), 0) as completed_jobs,
  coalesce(
    avg(
      case
        when q_hist.created_at is not null and j_hist.created_at is not null then
          extract(epoch from (q_hist.created_at - j_hist.created_at)) / 3600
        else null
      end
    )::numeric(6,2),
    24
  ) as avg_response_hours,
  case when p.id_verification_status = 'approved' then 5 else 0 end as id_verified_score,
  coalesce(
    (
      select 10
      from public.pro_documents pd
      where pd.profile_id = p.id
        and pd.document_type = 'tax_clearance'
        and pd.verification_status = 'verified'
        and pd.archived_at is null
      limit 1
    ),
    0
  ) as tax_clearance_score,
  coalesce(
    (
      select 10
      from public.pro_documents pd
      where pd.profile_id = p.id
        and pd.document_type = 'public_liability_insurance'
        and pd.verification_status = 'verified'
        and pd.archived_at is null
      limit 1
    ),
    0
  ) as insurance_score,
  coalesce(
    (
      select 5
      from public.pro_documents pd
      where pd.profile_id = p.id
        and pd.document_type = 'safe_pass'
        and pd.verification_status = 'verified'
        and pd.archived_at is null
      limit 1
    ),
    0
  ) as safe_pass_score,
  (
    case when p.id_verification_status = 'approved' then 5 else 0 end
    + coalesce(
        (
          select 10 from public.pro_documents pd
          where pd.profile_id = p.id
            and pd.document_type = 'tax_clearance'
            and pd.verification_status = 'verified'
            and pd.archived_at is null
          limit 1
        ), 0
      )
    + coalesce(
        (
          select 10 from public.pro_documents pd
          where pd.profile_id = p.id
            and pd.document_type = 'public_liability_insurance'
            and pd.verification_status = 'verified'
            and pd.archived_at is null
          limit 1
        ), 0
      )
    + coalesce(
        (
          select 5 from public.pro_documents pd
          where pd.profile_id = p.id
            and pd.document_type = 'safe_pass'
            and pd.verification_status = 'verified'
            and pd.archived_at is null
          limit 1
        ), 0
      )
  ) as total_trust_score
from public.profiles p
left join public.reviews r on r.pro_id = p.id and r.is_public = true
left join public.jobs j on j.status = 'completed'
left join public.quotes q_acc on q_acc.id = j.accepted_quote_id
left join public.quotes q_hist on q_hist.pro_id = p.id
left join public.jobs j_hist on j_hist.id = q_hist.job_id
where exists (
  select 1 from public.user_roles ur
  where ur.user_id = p.id and ur.role = 'verified_pro'
)
group by p.id, p.id_verification_status, p.compliance_score;

create unique index if not exists idx_provider_rankings_provider_id
  on public.provider_rankings(provider_id);
