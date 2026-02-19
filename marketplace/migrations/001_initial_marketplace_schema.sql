-- Supabase/PostgreSQL schema for Irish service marketplace
create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'verified_pro', 'admin');
create type public.job_status as enum ('open', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled');
create type public.quote_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  phone text,
  is_verified boolean not null default false,
  verification_status public.verification_status not null default 'unverified',
  insurance_expiry_date date,
  safe_pass_id text,
  stripe_account_id text,
  stripe_requirements_due jsonb,
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  address_line_1 text not null,
  address_line_2 text,
  locality text,
  county text,
  eircode text not null check (eircode ~* '^[AC-FHKNPRTV-Y][0-9]{2}\s?[AC-FHKNPRTV-Y0-9]{4}$'),
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  description text not null,
  eircode text not null check (eircode ~* '^[AC-FHKNPRTV-Y][0-9]{2}\s?[AC-FHKNPRTV-Y0-9]{4}$'),
  address_id uuid references public.addresses(id) on delete set null,
  budget_range text not null,
  status public.job_status not null default 'open',
  photo_urls text[] not null default '{}',
  accepted_quote_id uuid,
  complete_marked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  pro_id uuid not null references public.profiles(id) on delete cascade,
  quote_amount_cents integer not null check (quote_amount_cents > 0),
  message text,
  availability_slots jsonb not null,
  status public.quote_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, pro_id)
);

alter table public.jobs
  add constraint jobs_accepted_quote_fk
  foreign key (accepted_quote_id) references public.quotes(id) on delete set null;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  pro_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(job_id, customer_id)
);

create table if not exists public.pro_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('public_liability_insurance', 'id_verification')),
  storage_path text not null,
  verification_status public.verification_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  pro_id uuid not null references public.profiles(id) on delete cascade,
  stripe_payment_intent_id text not null unique,
  stripe_transfer_id text,
  amount_cents integer not null,
  commission_cents integer not null,
  vat_rate numeric(5,2),
  vat_amount_cents integer,
  status text not null check (status in ('authorized', 'captured', 'cancelled', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jobs_customer on public.jobs(customer_id);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_eircode on public.jobs(eircode);
create index if not exists idx_quotes_job on public.quotes(job_id);
create index if not exists idx_quotes_pro on public.quotes(pro_id);

create or replace function public.enforce_verified_pro_for_quotes()
returns trigger as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = new.pro_id
      and p.role = 'verified_pro'
      and p.is_verified = true
  ) then
    raise exception 'Pro is not verified and cannot submit quotes';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_enforce_verified_pro
before insert on public.quotes
for each row execute function public.enforce_verified_pro_for_quotes();

-- Basic row level security policies (expand as needed)
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.quotes enable row level security;
alter table public.reviews enable row level security;
alter table public.pro_documents enable row level security;
