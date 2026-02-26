import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { disputeRespondSchema } from '@/lib/validation/api';
import { getDisputeParticipantContext } from '@/lib/disputes';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const parsed = disputeRespondSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: dispute } = await supabase.from('disputes').select('id,job_id,status').eq('id', id).maybeSingle();
  if (!dispute) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });

  const context = await getDisputeParticipantContext(supabase, dispute.job_id);
  if (!context || user.id !== context.providerId) {
    return NextResponse.json({ error: 'Only the assigned provider can submit response.' }, { status: 403 });
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { data: updated, error } = await serviceSupabase
    .from('disputes')
    .update({
      provider_response: parsed.data.response,
      status: dispute.status === 'open' ? 'under_review' : dispute.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? 'Dispute response failed.' }, { status: 400 });
  }

  await serviceSupabase.from('dispute_logs').insert({
    dispute_id: id,
    actor_id: user.id,
    actor_role: 'provider',
    action: 'provider_response',
    details: { response: parsed.data.response },
    old_status: dispute.status,
    new_status: updated.status,
  });

  await serviceSupabase.from('notifications').insert({
    user_id: context.customerId,
    type: 'dispute_response_received',
    payload: {
      dispute_id: id,
      job_id: dispute.job_id,
    },
  });

  return NextResponse.json({ dispute: updated }, { status: 200 });
}