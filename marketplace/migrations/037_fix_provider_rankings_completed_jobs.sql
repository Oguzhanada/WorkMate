-- Fix provider_rankings materialized view: completed_jobs was a cartesian
-- join of all providers × all completed jobs (every provider got the same
-- inflated count). Replace with a correlated subquery scoped to each provider.

drop materialized view if exists public.provider_rankings;

create materialized view public.provider_rankings as
select
  p.id as provider_id,

  coalesce(avg(r.rating)::numeric(4,2), 0)      as avg_rating,
  coalesce(count(distinct r.id), 0)             as review_count,

  -- FIXED: count only jobs where THIS provider's quote was accepted
  (
    select coalesce(count(*)::integer, 0)
    from public.quotes qa
    join public.jobs jc on jc.id = qa.job_id
    where qa.pro_id = p.id
      and jc.status = 'completed'
      and jc.accepted_quote_id = qa.id
  ) as completed_jobs,

  -- avg hours between job posted and provider's first quote (response speed)
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
    (select 10 from public.pro_documents pd
     where pd.profile_id = p.id
       and pd.document_type = 'tax_clearance'
       and pd.verification_status = 'verified'
       and pd.archived_at is null
     limit 1),
    0
  ) as tax_clearance_score,

  coalesce(
    (select 10 from public.pro_documents pd
     where pd.profile_id = p.id
       and pd.document_type = 'public_liability_insurance'
       and pd.verification_status = 'verified'
       and pd.archived_at is null
     limit 1),
    0
  ) as insurance_score,

  coalesce(
    (select 5 from public.pro_documents pd
     where pd.profile_id = p.id
       and pd.document_type = 'safe_pass'
       and pd.verification_status = 'verified'
       and pd.archived_at is null
     limit 1),
    0
  ) as safe_pass_score,

  (
    case when p.id_verification_status = 'approved' then 5 else 0 end
    + coalesce((select 10 from public.pro_documents pd where pd.profile_id = p.id and pd.document_type = 'tax_clearance' and pd.verification_status = 'verified' and pd.archived_at is null limit 1), 0)
    + coalesce((select 10 from public.pro_documents pd where pd.profile_id = p.id and pd.document_type = 'public_liability_insurance' and pd.verification_status = 'verified' and pd.archived_at is null limit 1), 0)
    + coalesce((select 5 from public.pro_documents pd where pd.profile_id = p.id and pd.document_type = 'safe_pass' and pd.verification_status = 'verified' and pd.archived_at is null limit 1), 0)
  ) as total_trust_score

from public.profiles p
left join public.reviews r
  on r.pro_id = p.id and r.is_public = true
left join public.quotes q_hist
  on q_hist.pro_id = p.id
left join public.jobs j_hist
  on j_hist.id = q_hist.job_id
where exists (
  select 1 from public.user_roles ur
  where ur.user_id = p.id and ur.role = 'verified_pro'
)
group by p.id, p.id_verification_status;

create unique index if not exists idx_provider_rankings_provider_id
  on public.provider_rankings(provider_id);

-- Refresh immediately so the corrected view is live
select public.refresh_provider_rankings();
