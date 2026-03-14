import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { normalizeEircode } from '@/lib/ireland/eircode';
import { profileAddressSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiValidationError, apiUnauthorized } from '@/lib/api/error-response';

async function postHandler(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  // Some OAuth signups may miss a profile row if setup triggers were not applied.
  // Ensure profile exists before writing address row with FK(profile_id -> profiles.id).
  const { error: ensureProfileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.email ? user.email.split('@')[0] : null),
      },
      { onConflict: 'id' }
    );

  if (ensureProfileError) {
    return apiError(ensureProfileError.message, 400);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = profileAddressSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const body = parsed.data;
  const eircode = normalizeEircode(body.eircode);

  const payload = {
    profile_id: user.id,
    address_line_1: body.address_line_1,
    address_line_2: body.address_line_2 || null,
    locality: body.locality,
    county: body.county,
    eircode,
  };

  const { data: existingAddress } = await supabase
    .from('addresses')
    .select('id')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingAddress?.id) {
    const { data, error } = await supabase
      .from('addresses')
      .update(payload)
      .eq('id', existingAddress.id)
      .select('*')
      .single();

    if (error) {
      return apiError(error.message, 400);
    }
    return NextResponse.json({ address: data }, { status: 200 });
  }

  const { data, error } = await supabase.from('addresses').insert(payload).select('*').single();
  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json({ address: data }, { status: 201 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
