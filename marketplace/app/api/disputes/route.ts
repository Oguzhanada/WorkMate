import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { createDisputeSchema } from '@/lib/validation/api';
import { getDisputeParticipantContext, isDisputeParticipant } from '@/lib/disputes';

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

  const parsed = createDisputeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;

  const { data: job } = await supabase
    .from('jobs')
    .select('id,status,dispute_deadline')
    .eq('id', body.job_id)
    .maybeSingle();

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (job.status !== 'completed') {
    return NextResponse.json({ error: 'Disputes can only be opened for completed jobs.' }, { status: 400 });
  }

  if (!job.dispute_deadline || new Date(job.dispute_deadline).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Dispute deadline has passed for this job.' }, { status: 400 });
  }

  const participantContext = await getDisputeParticipantContext(supabase, body.job_id);
  if (!participantContext || !isDisputeParticipant(user.id, participantContext)) {
    return NextResponse.json({ error: 'You are not allowed to dispute this job.' }, { status: 403 });
  }

  const { data: existingActive } = await supabase
    .from('disputes')
    .select('id')
    .eq('job_id', body.job_id)
    .in('status', ['open', 'under_review'])
    .maybeSingle();

  if (existingActive) {
    return NextResponse.json({ error: 'An active dispute already exists for this job.' }, { status: 400 });
  }

  const serviceSupabase = getSupabaseServiceClient();

  const { data: payment } = await serviceSupabase
    .from('payments')
    .select('stripe_payment_intent_id')
    .eq('job_id', body.job_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: dispute, error: createError } = await serviceSupabase
    .from('disputes')
    .insert({
      job_id: body.job_id,
      created_by: user.id,
      status: 'open',
      dispute_type: body.dispute_type,
      customer_claim: body.customer_claim,
      payment_intent_id: payment?.stripe_payment_intent_id ?? null,
      payment_status: 'on_hold',
      resolution_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('*')
    .single();

  if (createError || !dispute) {
    return NextResponse.json({ error: createError?.message ?? 'Dispute could not be created.' }, { status: 400 });
  }

  await serviceSupabase.from('jobs').update({ payment_on_hold: true }).eq('id', body.job_id);

  await serviceSupabase.from('dispute_logs').insert({
    dispute_id: dispute.id,
    actor_id: user.id,
    actor_role: user.id === participantContext.customerId ? 'customer' : 'provider',
    action: 'created',
    details: {
      dispute_type: body.dispute_type,
    },
    old_status: null,
    new_status: 'open',
  });

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);

  const notifyUserIds = new Set<string>();
  if (participantContext.customerId !== user.id) notifyUserIds.add(participantContext.customerId);
  if (participantContext.providerId && participantContext.providerId !== user.id) notifyUserIds.add(participantContext.providerId);

  if (!isAdmin) {
    const { data: admins } = await serviceSupabase.from('user_roles').select('user_id').eq('role', 'admin');
    for (const admin of admins ?? []) notifyUserIds.add(admin.user_id);
  }

  if (notifyUserIds.size > 0) {
    await serviceSupabase.from('notifications').insert(
      Array.from(notifyUserIds).map((targetUserId) => ({
        user_id: targetUserId,
        type: 'dispute_opened',
        payload: {
          dispute_id: dispute.id,
          job_id: dispute.job_id,
          dispute_type: dispute.dispute_type,
          created_by: user.id,
        },
      }))
    );
  }

  return NextResponse.json({ dispute }, { status: 201 });
}