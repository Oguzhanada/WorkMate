import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canQuoteJob, getUserRoles } from '@/lib/auth/rbac';
import { createQuoteSchema } from '@/lib/validation/api';

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,id_verification_status')
    .eq('id', user.id)
    .maybeSingle();

  if (!canQuoteJob(roles, profile?.id_verification_status)) {
    return NextResponse.json({ error: 'Only professionals can submit quotes' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createQuoteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;

  const { data, error } = await supabase.from('quotes').insert({
    job_id: body.job_id,
    pro_id: user.id,
    quote_amount_cents: body.quote_amount_cents,
    message: body.message,
    estimated_duration: body.estimated_duration,
    includes: body.includes,
    excludes: body.excludes,
    availability_slots: body.availability_slots,
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ quote: data }, { status: 201 });
}
