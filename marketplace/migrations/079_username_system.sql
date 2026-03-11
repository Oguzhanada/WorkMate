-- Migration 079: Username system
-- Adds username column to profiles, updates new-user trigger, fixes admin role assignment.

-- 1. Add username column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON profiles (lower(username))
  WHERE username IS NOT NULL;

-- 3. Update handle_new_user: extract username from signup metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Sanitize username: lowercase, alphanumeric + underscore only, 3-20 chars
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

-- 4. Fix ensure_customer_role: admins do NOT get a customer role
CREATE OR REPLACE FUNCTION ensure_customer_role_on_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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
