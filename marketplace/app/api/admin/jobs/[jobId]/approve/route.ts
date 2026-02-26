import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { adminJobDecisionSchema } from '@/lib/validation/api';

export async function PATCH(
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

  return NextResponse.json({ job }, { status: 200 });
}