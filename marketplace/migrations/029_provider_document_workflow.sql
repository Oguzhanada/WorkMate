-- Provider document workflow expansion for role-based onboarding and lifecycle management.

alter table if exists public.pro_documents
  add column if not exists document_label text,
  add column if not exists document_subtype text,
  add column if not exists expires_at date,
  add column if not exists coverage_amount_eur numeric(12,2),
  add column if not exists cro_number text,
  add column if not exists trade_license_code text,
  add column if not exists rejection_reason text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists archived_at timestamptz,
  add column if not exists replaced_by_document_id uuid references public.pro_documents(id),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'pro_documents_document_type_check'
      and conrelid = 'public.pro_documents'::regclass
  ) then
    alter table public.pro_documents drop constraint pro_documents_document_type_check;
  end if;
end $$;

alter table public.pro_documents
  add constraint pro_documents_document_type_check
  check (
    document_type in (
      'id_verification',
      'public_liability_insurance',
      'safe_pass',
      'tax_clearance',
      'trade_license',
      'other',
      'safe_electric',
      'reci',
      'rgi',
      'tax_clearance_number'
    )
  );

create index if not exists idx_pro_documents_profile_type_status
  on public.pro_documents(profile_id, document_type, verification_status, created_at desc);

create index if not exists idx_pro_documents_expires_at
  on public.pro_documents(expires_at)
  where archived_at is null;

create or replace function public.set_pro_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pro_documents_set_updated_at on public.pro_documents;
create trigger trg_pro_documents_set_updated_at
before update on public.pro_documents
for each row
execute function public.set_pro_documents_updated_at();

create table if not exists public.provider_document_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid references public.pro_documents(id) on delete set null,
  notification_type text not null check (notification_type in ('approved','rejected','expiring_soon','expired','bulk_approved')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_provider_document_notifications_profile_created
  on public.provider_document_notifications(profile_id, created_at desc);

alter table public.provider_document_notifications enable row level security;

drop policy if exists provider_document_notifications_select_own on public.provider_document_notifications;
create policy provider_document_notifications_select_own
on public.provider_document_notifications
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists provider_document_notifications_insert_admin on public.provider_document_notifications;
create policy provider_document_notifications_insert_admin
on public.provider_document_notifications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);
