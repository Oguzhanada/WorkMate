import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { adminJobDecisionSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { sendJobApprovedEmail } from '@/lib/email/send';

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { jobId } = await params;

  let rawBody: unknown = {};
  try {
    rawBody = await request.json();
  } catch {
    rawBody = {};
  }

  const parsed = adminJobDecisionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const serviceSupabase = getSupabaseServiceClient();
  const nowIso = new Date().toISOString();

  const { data: job, error: jobError } = await serviceSupabase
    .from('jobs')
    .update({
      review_status: 'approved',
      reviewed_at: nowIso,
      reviewed_by: auth.user?.id ?? null,
      rejection_reason: null,
    })
    .eq('id', jobId)
    .eq('review_status', 'pending_review')
    .select('id,title,customer_id')
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message ?? 'Job is not pending review.' }, { status: 400 });
  }

  await serviceSupabase.from('notifications').insert({
    user_id: job.customer_id,
    type: 'job_review_approved',
    payload: {
      job_id: job.id,
      title: job.title,
      reviewed_at: nowIso,
      note: parsed.data.note,
    },
  });

  // Fire-and-forget approval email — never blocks the response.
  void (async () => {
    try {
      const [{ data: profile }, { data: authUser }] = await Promise.all([
        serviceSupabase
          .from('profiles')
          .select('display_name')
          .eq('id', job.customer_id)
          .single(),
        serviceSupabase.auth.admin.getUserById(job.customer_id),
      ]);
      const email = authUser?.user?.email;
      if (email) {
        sendJobApprovedEmail({
          to: email,
          customerName: profile?.display_name ?? 'there',
          jobTitle: job.title ?? 'your job',
          jobId: job.id,
        });
      }
    } catch {
      // Non-blocking — email lookup failure must not affect the approval response.
    }
  })();

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: 'approve_job',
    targetType: 'job',
    targetLabel: job.title ?? null,
    details: {
      job_id: jobId,
      note: parsed.data.note ?? null,
      old_status: 'pending_review',
      new_status: 'approved',
    },
  });

  return NextResponse.json({ job }, { status: 200 });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
