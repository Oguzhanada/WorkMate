import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { normalizeEircode, isValidEircode } from '@/lib/eircode';
import { profileAddressSchema } from '@/lib/validation/api';

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = profileAddressSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const eircode = normalizeEircode(body.eircode);
  if (!isValidEircode(eircode)) {
    return NextResponse.json({ error: 'Invalid Eircode format' }, { status: 400 });
  }

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
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ address: data }, { status: 200 });
  }

  const { data, error } = await supabase.from('addresses').insert(payload).select('*').single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ address: data }, { status: 201 });
}
