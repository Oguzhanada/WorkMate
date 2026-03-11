import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { cancelJobSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiValidationError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/error-response';

/**
 * Penalty schedule:
 *   - status 'accepted', created < 1 hour ago  → 0%   (full refund grace period)
 *   - status 'accepted', created >= 1 hour ago → 10%  (late cancel on accepted job)
 *   - status 'in_progress'                     → 30%  (provider already started)
 */
const CANCELLABLE_STATUSES = ['accepted', 'in_progress'] as const;
type CancellableStatus = (typeof CANCELLABLE_STATUSES)[number];

function isCancellable(status: string): status is CancellableStatus {
  return (CANCELLABLE_STATUSES as readonly string[]).includes(status);
}

function calculatePenalty(
  status: CancellableStatus,
  jobCreatedAt: string,
  paymentAmountCents: number,
): { penaltyCents: number; refundCents: number; penaltyRate: number } {
  if (status === 'in_progress') {
    const penaltyCents = Math.round(paymentAmountCents * 0.3);
    return { penaltyCents, refundCents: paymentAmountCents - penaltyCents, penaltyRate: 0.3 };
  }

  // status === 'accepted' — check age
  const ageMs = Date.now() - new Date(jobCreatedAt).getTime();
  const oneHourMs = 60 * 60 * 1000;

  if (ageMs < oneHourMs) {
    return { penaltyCents: 0, refundCents: paymentAmountCents, penaltyRate: 0 };
  }

  const penaltyCents = Math.round(paymentAmountCents * 0.1);
  return { penaltyCents, refundCents: paymentAmountCents - penaltyCents, penaltyRate: 0.1 };
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canPostJob(roles)) {
    return apiForbidden('Only customers can cancel jobs');
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = cancelJobSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const { reason } = parsed.data;

  const serviceSupabase = getSupabaseServiceClient();

  // Load job — must belong to the authenticated customer
  const { data: job, error: jobError } = await serviceSupabase
    .from('jobs')
    .select('id, status, customer_id, created_at, accepted_quote_id')
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (jobError || !job) {
    return apiNotFound('Job not found');
  }

  if (!isCancellable(job.status)) {
    const statusLabel = job.status === 'completed'
      ? 'completed jobs cannot be cancelled'
      : job.status === 'cancelled'
        ? 'this job is already cancelled'
        : `jobs with status "${job.status}" cannot be cancelled`;
    return apiError(`Cannot cancel: ${statusLabel}`, 400);
  }

  // Look up the authorised payment amount (if any) to compute penalty against
  const { data: payment } = await serviceSupabase
    .from('payments')
    .select('id, amount_cents, status')
    .eq('job_id', jobId)
    .in('status', ['authorized', 'captured'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentAmountCents: number = payment?.amount_cents ?? 0;

  const { penaltyCents, refundCents, penaltyRate } = calculatePenalty(
    job.status as CancellableStatus,
    job.created_at as string,
    paymentAmountCents,
  );

  // Mark job as cancelled
  const { error: cancelError } = await serviceSupabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId);

  if (cancelError) {
    return apiError(cancelError.message, 400);
  }

  // Write audit log — fire-and-forget, non-blocking
  void logAdminAudit({
    adminUserId: user.id,
    adminEmail: user.email ?? null,
    action: 'customer_cancel_job',
    targetType: 'job',
    details: {
      job_id: jobId,
      reason,
      previous_status: job.status,
      penalty_rate: penaltyRate,
      penalty_cents: penaltyCents,
      refund_cents: refundCents,
      payment_id: payment?.id ?? null,
    },
  });

  return NextResponse.json(
    {
      success: true,
      job_id: jobId,
      previous_status: job.status,
      reason,
      penalty_cents: penaltyCents,
      refund_cents: refundCents,
      penalty_rate: penaltyRate,
      payment_pending_refund: paymentAmountCents > 0,
    },
    { status: 200 },
  );
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
