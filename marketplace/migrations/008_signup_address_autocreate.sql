-- Auto-create address row from signup metadata

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  requested_status public.verification_status;
  meta_eircode text;
  meta_address_line_1 text;
  meta_address_line_2 text;
  meta_locality text;
  meta_county text;
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

  insert into public.profiles (
    id,
    role,
    full_name,
    phone,
    verification_status,
    is_verified
  )
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    requested_status,
    false
  )
  on conflict (id) do nothing;

  meta_eircode := upper(trim(coalesce(new.raw_user_meta_data ->> 'eircode', '')));
  meta_address_line_1 := nullif(trim(coalesce(new.raw_user_meta_data ->> 'address_line_1', '')), '');
  meta_address_line_2 := nullif(trim(coalesce(new.raw_user_meta_data ->> 'address_line_2', '')), '');
  meta_locality := nullif(trim(coalesce(new.raw_user_meta_data ->> 'locality', new.raw_user_meta_data ->> 'city', '')), '');
  meta_county := nullif(trim(coalesce(new.raw_user_meta_data ->> 'county', '')), '');

  if meta_eircode ~* '^[AC-FHKNPRTV-Y][0-9]{2}\s?[AC-FHKNPRTV-Y0-9]{4}$'
     and meta_address_line_1 is not null then
    insert into public.addresses (
      profile_id,
      address_line_1,
      address_line_2,
      locality,
      county,
      eircode
    )
    values (
      new.id,
      meta_address_line_1,
      meta_address_line_2,
      meta_locality,
      meta_county,
      meta_eircode
    );
  end if;

  return new;
end;
$$;
