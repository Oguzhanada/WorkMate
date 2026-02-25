-- Enforce minimum document set for provider application submission.
-- A profile cannot be marked as submitted provider application without:
-- 1) ID verification document
-- 2) Professional proof document (currently stored as public_liability_insurance)

create or replace function public.enforce_provider_submission_documents()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.stripe_requirements_due ->> 'application_status', '') = 'submitted' then
    if not exists (
      select 1
      from public.pro_documents d
      where d.profile_id = new.id
        and d.document_type = 'id_verification'
    ) then
      raise exception 'Provider submission requires ID document';
    end if;

    if not exists (
      select 1
      from public.pro_documents d
      where d.profile_id = new.id
        and d.document_type = 'public_liability_insurance'
    ) then
      raise exception 'Provider submission requires professional proof document';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_provider_submission_documents on public.profiles;
create trigger trg_enforce_provider_submission_documents
before insert or update of stripe_requirements_due on public.profiles
for each row
execute function public.enforce_provider_submission_documents();
