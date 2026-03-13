-- ============================================================
-- Migration 081 — Security & Performance Fixes
-- ============================================================
-- Fixes applied:
--   1. Drop duplicate nightly provider rankings cron job
--   2. Fix provider_subscriptions RLS (restrict to service_role)
--   3. Add 3 missing FK indexes
--   4. Drop 5 low-cardinality / never-used boolean indexes
--   5. Enable unaccent + pg_trgm extensions
--   6. Fix search_path on 21 functions (security hardening)
--   7. Update cron jobs 1 + 8 to read Bearer tokens from Vault
--      (Vault secrets must be pre-seeded — see scripts/setup-vault-secrets.sql)
-- ============================================================


-- ── 1. DROP DUPLICATE CRON JOB ───────────────────────────────
-- job 9 (hourly) fully subsumes job 3 (nightly 03:00).
-- Both call refresh_provider_rankings_safe(). Remove the redundant one.
SELECT cron.unschedule('refresh-provider-rankings-nightly');


-- ── 2. FIX provider_subscriptions RLS ────────────────────────
-- Old policy: FOR ALL, no role restriction → USING(true)/WITH CHECK(true)
-- applies to ALL roles including authenticated. Fix: restrict to service_role.
DROP POLICY IF EXISTS "Service role manages subscriptions"
  ON public.provider_subscriptions;

CREATE POLICY "Service role manages subscriptions"
  ON public.provider_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ── 3. MISSING FK INDEXES ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_favourite_providers_provider_id
  ON public.favourite_providers (provider_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_category_id
  ON public.portfolio_items (category_id);

CREATE INDEX IF NOT EXISTS idx_referral_redemptions_redeemed_by
  ON public.referral_redemptions (redeemed_by);


-- ── 4. DROP LOW-CARDINALITY / USELESS INDEXES ─────────────────
-- Boolean columns (requires_verified_id, is_urgent): sequential scan is
-- faster than a btree index on a 2-value column at any realistic table size.
-- loyalty_level (4 values) and dispute status (5 values) same reasoning.
DROP INDEX IF EXISTS public.idx_jobs_requires_verified_id;
DROP INDEX IF EXISTS public.idx_jobs_is_urgent;
DROP INDEX IF EXISTS public.idx_profiles_loyalty_level;
DROP INDEX IF EXISTS public.idx_disputes_status;
DROP INDEX IF EXISTS public.idx_portfolio_items_visibility;


-- ── 5. EXTENSIONS ─────────────────────────────────────────────
-- unaccent: accent-insensitive search (Irish names: Ó'Brien, Áine, etc.)
-- pg_trgm:  trigram similarity for fuzzy provider/job search
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm  WITH SCHEMA extensions;


-- ── 6. FUNCTIONS: FIX search_path ────────────────────────────
-- All 21 functions below lacked SET search_path, exposing them to
-- potential schema injection. Fixed with SET search_path = public, pg_catalog.

-- Simple updated_at triggers (6)
CREATE OR REPLACE FUNCTION public.set_pro_documents_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.set_task_alerts_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.set_customer_provider_history_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.set_job_contracts_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.set_feature_flags_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.set_provider_subscriptions_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.touch_quote_daily_limits_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.set_time_entries_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Business logic triggers
CREATE OR REPLACE FUNCTION public.jobs_set_dispute_deadline()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  if new.status = 'completed' and (old.status is distinct from new.status or old.complete_marked_at is distinct from new.complete_marked_at) then
    new.dispute_deadline := coalesce(new.complete_marked_at, now()) + interval '14 days';
  elsif new.status <> 'completed' then
    new.dispute_deadline := null;
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.jobs_set_auto_release_dates()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
declare
  base_completed_at timestamptz;
begin
  if new.status = 'completed' and old.status is distinct from new.status then
    base_completed_at := coalesce(new.completed_at, new.complete_marked_at, now());
    new.completed_at := base_completed_at;
    new.auto_release_at := coalesce(new.auto_release_at, base_completed_at + interval '14 days');
  end if;

  if new.status <> 'completed' then
    new.auto_release_at := null;
    new.payment_released_at := null;
    new.release_reminder_sent_at := null;
  end if;

  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.resolve_contract_status()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  if new.customer_signed_at is not null and new.provider_signed_at is not null then
    new.status = 'signed_both';
  elsif new.customer_signed_at is not null and new.provider_signed_at is null then
    new.status = 'signed_customer';
  elsif new.provider_signed_at is not null and new.customer_signed_at is null then
    new.status = 'signed_provider';
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.sync_provider_matching_priority_from_id_status()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
begin
  if new.id_verification_status = 'approved' then
    new.provider_matching_priority := 10;
  else
    new.provider_matching_priority := 1;
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.validate_appointment_schedule()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path = public, pg_catalog
AS $$
declare
  local_start timestamp;
  local_end   timestamp;
begin
  if new.end_time <= new.start_time then
    raise exception 'Appointment end_time must be after start_time';
  end if;

  local_start := new.start_time at time zone 'Europe/Dublin';
  local_end   := new.end_time   at time zone 'Europe/Dublin';

  if local_start::date <> local_end::date then
    raise exception 'Appointment must start and end on the same calendar day';
  end if;

  if not exists (
    select 1
    from public.jobs j
    join public.quotes q on q.id = j.accepted_quote_id
    where j.id = new.job_id
      and j.customer_id = new.customer_id
      and q.pro_id = new.provider_id
  ) then
    raise exception 'Appointment participants must match the accepted job quote';
  end if;

  if new.status = 'scheduled' then
    if not exists (
      select 1
      from public.provider_availability pa
      where pa.provider_id = new.provider_id
        and (
          (
            pa.is_recurring = true
            and pa.day_of_week = extract(dow from local_start)::integer
            and pa.start_time <= local_start::time
            and pa.end_time   >= local_end::time
          )
          or (
            pa.is_recurring = false
            and pa.specific_date = local_start::date
            and pa.start_time <= local_start::time
            and pa.end_time   >= local_end::time
          )
        )
    ) then
      raise exception 'Appointment does not fit provider availability';
    end if;

    if exists (
      select 1
      from public.appointments a
      where a.provider_id = new.provider_id
        and a.status = 'scheduled'
        and a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and a.start_time < new.end_time
        and a.end_time   > new.start_time
    ) then
      raise exception 'Provider already has a scheduled appointment in this time window';
    end if;
  end if;

  return new;
end;
$$;

-- SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.purge_old_health_check_logs()
  RETURNS void LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
  delete from public.health_check_log
  where checked_at < now() - interval '90 days';
$$;

CREATE OR REPLACE FUNCTION public.refresh_provider_rankings_safe()
  RETURNS void LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
begin
  refresh materialized view concurrently public.provider_rankings;

  insert into public.health_check_log (check_name, status, detail)
  values ('provider_rankings_refresh', 'ok', null);

exception when others then
  insert into public.health_check_log (check_name, status, detail)
  values ('provider_rankings_refresh', 'error', sqlerrm);
end;
$$;

CREATE OR REPLACE FUNCTION public.trg_update_docs_compliance_score()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
declare
  v_profile_id uuid;
begin
  if (tg_op = 'DELETE') then
    v_profile_id := old.profile_id;
  else
    v_profile_id := new.profile_id;
  end if;
  update public.profiles
  set compliance_score = public.calculate_compliance_score(v_profile_id)
  where id = v_profile_id;
  if (tg_op = 'DELETE') then return old; else return new; end if;
end;
$$;

CREATE OR REPLACE FUNCTION public.trg_update_profile_compliance_score()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
begin
  if (tg_op = 'UPDATE') then
    if (new.id_verification_status is distinct from old.id_verification_status) or
       (new.verification_status is distinct from old.verification_status) then
      new.compliance_score := public.calculate_compliance_score(new.id);
    end if;
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.enforce_verified_pro_for_quotes()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.ensure_customer_role_on_profile_insert()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
begin
  if new.role = 'admin' then
    return new;
  end if;
  insert into public.user_roles (user_id, role, created_at, updated_at)
  values (new.id, 'customer', now(), now())
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.generate_founding_pro_referral_code()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
begin
  if new.is_founding_pro = true and (old.is_founding_pro is null or old.is_founding_pro = false) then
    insert into public.referral_codes (profile_id, code, max_uses)
    values (
      new.id,
      'WM-' || upper(substr(md5(new.id::text || now()::text), 1, 8)),
      10
    )
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
declare
  requested_role       public.user_role;
  requested_status     public.verification_status;
  meta_eircode         text;
  meta_address_line_1  text;
  meta_address_line_2  text;
  meta_locality        text;
  meta_county          text;
  meta_username        text;
begin
  requested_role := case
    when (new.raw_user_meta_data ->> 'role') in ('customer', 'verified_pro', 'admin')
      then (new.raw_user_meta_data ->> 'role')::public.user_role
    else 'customer'::public.user_role
  end;

  requested_status := case
    when requested_role = 'verified_pro' then 'pending'::public.verification_status
    else 'unverified'::public.verification_status
  end;

  meta_username := nullif(
    lower(regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'username', ''),
      '[^a-z0-9_]', '', 'g'
    )),
    ''
  );
  if meta_username is not null and char_length(meta_username) > 20 then
    meta_username := left(meta_username, 20);
  end if;
  if meta_username is not null and char_length(meta_username) < 3 then
    meta_username := null;
  end if;

  insert into public.profiles (
    id, role, full_name, phone, verification_status, is_verified, username
  )
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    requested_status,
    false,
    meta_username
  )
  on conflict (id) do nothing;

  meta_eircode        := upper(trim(coalesce(new.raw_user_meta_data ->> 'eircode', '')));
  meta_address_line_1 := nullif(trim(coalesce(new.raw_user_meta_data ->> 'address_line_1', '')), '');
  meta_address_line_2 := nullif(trim(coalesce(new.raw_user_meta_data ->> 'address_line_2', '')), '');
  meta_locality       := nullif(trim(coalesce(new.raw_user_meta_data ->> 'locality', new.raw_user_meta_data ->> 'city', '')), '');
  meta_county         := nullif(trim(coalesce(new.raw_user_meta_data ->> 'county', '')), '');

  if meta_eircode ~* '^[AC-FHKNPRTV-Y][0-9]{2}\s?[AC-FHKNPRTV-Y0-9]{4}$'
     and meta_address_line_1 is not null then
    insert into public.addresses (
      profile_id, address_line_1, address_line_2, locality, county, eircode
    )
    values (
      new.id, meta_address_line_1, meta_address_line_2,
      meta_locality, meta_county, meta_eircode
    );
  end if;

  return new;
end;
$$;


-- ── 7. CRON JOBS: READ BEARER TOKENS FROM VAULT ───────────────
-- Secrets 'cron_idv_secret' and 'cron_gdpr_secret' must exist in
-- vault.secrets before this runs. See scripts/setup-vault-secrets.sql.
-- Tokens are read at runtime from vault.decrypted_secrets (encrypted at rest).

UPDATE cron.job
SET command = $cmd$
  SELECT net.http_post(
    url     := 'https://ejpnmcxzycxqfdbetydp.supabase.co/functions/v1/id-verification-retention',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM   vault.decrypted_secrets
        WHERE  name = 'cron_idv_secret'
      )
    ),
    body    := '{}'::jsonb
  );
$cmd$
WHERE jobname = 'id-verification-retention-daily';

UPDATE cron.job
SET command = $cmd$
  SELECT extensions.http((
    'POST',
    'https://ejpnmcxzycxqfdbetydp.supabase.co/functions/v1/gdpr-retention-processor',
    '{}',
    'application/json',
    ARRAY[extensions.http_header(
      'Authorization',
      'Bearer ' || (
        SELECT decrypted_secret
        FROM   vault.decrypted_secrets
        WHERE  name = 'cron_gdpr_secret'
      )
    )]
  )::extensions.http_request);
$cmd$
WHERE jobname = 'gdpr-retention-daily';
