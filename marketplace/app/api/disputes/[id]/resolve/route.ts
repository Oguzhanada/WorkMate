import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { disputeResolveSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiNotFound } from '@/lib/api/error-response';

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = disputeResolveSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const serviceSupabase = getSupabaseServiceClient();

  const { data: dispute } = await serviceSupabase
    .from('disputes')
    .select('id,job_id,status')
    .eq('id', id)
    .maybeSingle();

  if (!dispute) {
    return apiNotFound('Dispute not found');
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error } = await serviceSupabase
    .from('disputes')
    .update({
      status: parsed.data.status,
      resolution_type: parsed.data.resolution_type,
      resolution_amount_cents: parsed.data.resolution_amount_cents ?? null,
      admin_notes: parsed.data.admin_notes,
      resolved_at: nowIso,
      resolved_by: auth.user?.id ?? null,
      payment_status:
        parsed.data.resolution_type === 'full_refund'
          ? 'refunded_to_customer'
          : parsed.data.resolution_type === 'partial_refund'
          ? 'split'
          : 'released_to_provider',
      updated_at: nowIso,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !updated) {
    return apiError(error?.message ?? 'Dispute could not be resolved.', 400);
  }

  await serviceSupabase.from('dispute_logs').insert({
    dispute_id: id,
    actor_id: auth.user?.id ?? '',
    actor_role: 'admin',
    action: 'resolved',
    details: {
      resolution_type: parsed.data.resolution_type,
      resolution_amount_cents: parsed.data.resolution_amount_cents ?? null,
      admin_notes: parsed.data.admin_notes,
    },
    old_status: dispute.status,
    new_status: parsed.data.status,
  });

  const { data: job } = await serviceSupabase
    .from('jobs')
    .select('customer_id,accepted_quote_id')
    .eq('id', dispute.job_id)
    .maybeSingle();

  let providerId: string | null = null;
  if (job?.accepted_quote_id) {
    const { data: quote } = await serviceSupabase
      .from('quotes')
      .select('pro_id')
      .eq('id', job.accepted_quote_id)
      .maybeSingle();
    providerId = quote?.pro_id ?? null;
  }

  const notifyTargets = [job?.customer_id, providerId].filter(Boolean) as string[];
  if (notifyTargets.length > 0) {
    await serviceSupabase.from('notifications').insert(
      notifyTargets.map((userId) => ({
        user_id: userId,
        type: 'dispute_resolved',
        payload: {
          dispute_id: id,
          job_id: dispute.job_id,
          resolution_type: parsed.data.resolution_type,
          status: parsed.data.status,
        },
      }))
    );
  }

  await serviceSupabase.from('jobs').update({ payment_on_hold: false }).eq('id', dispute.job_id);

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: 'resolve_dispute',
    targetType: 'dispute',
    targetLabel: id,
    details: {
      dispute_id: id,
      job_id: dispute.job_id,
      old_status: dispute.status,
      new_status: parsed.data.status,
      resolution_type: parsed.data.resolution_type,
      resolution_amount_cents: parsed.data.resolution_amount_cents ?? null,
    },
  });

  return NextResponse.json({ dispute: updated }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
