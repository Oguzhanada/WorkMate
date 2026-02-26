import { NextRequest, NextResponse } from 'next/server';

import { normalizeEircode, isValidEircode } from '@/lib/eircode';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { updateJobDraftSchema } from '@/lib/validation/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .select('id,title,description,eircode,county,locality,budget_range,status,review_status,created_at')
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({ job }, { status: 200 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateJobDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const eircode = normalizeEircode(parsed.data.eircode);
  if (!isValidEircode(eircode)) {
    return NextResponse.json({ error: 'Please enter a valid Eircode.' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from('jobs')
    .select('id,status,review_status,customer_id')
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (!['open', 'quoted'].includes(existing.status)) {
    return NextResponse.json(
      { error: 'Only open/quoted jobs can be edited from this summary page.' },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from('jobs')
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      eircode,
      county: parsed.data.county,
      locality: parsed.data.locality,
      budget_range: parsed.data.budget_range,
    })
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .select('id,title,description,eircode,county,locality,budget_range,status,review_status,created_at')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ job: updated }, { status: 200 });
}
