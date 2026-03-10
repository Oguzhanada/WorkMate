import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canQuote, getUserRoles } from '@/lib/auth/rbac';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function postHandler(
  _request: Request,
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

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return NextResponse.json({ error: 'Only providers can send release reminders.' }, { status: 403 });
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id,customer_id,accepted_quote_id,status,auto_release_at,release_reminder_sent_at')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status !== 'completed' || !job.auto_release_at) {
    return NextResponse.json({ error: 'Release reminder is only available for completed jobs.' }, { status: 400 });
  }

  if (job.release_reminder_sent_at) {
    const last = new Date(job.release_reminder_sent_at).getTime();
    if (Date.now() - last < 12 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Reminder already sent recently. Please wait before sending another.' }, { status: 400 });
    }
  }

  if (!job.accepted_quote_id) {
    return NextResponse.json({ error: 'No accepted provider found for this job.' }, { status: 400 });
  }

  const { data: quote } = await supabase
    .from('quotes')
    .select('pro_id')
    .eq('id', job.accepted_quote_id)
    .maybeSingle();

  if (!quote || quote.pro_id !== user.id) {
    return NextResponse.json({ error: 'You are not assigned to this job.' }, { status: 403 });
  }

  const serviceSupabase = getSupabaseServiceClient();
  const nowIso = new Date().toISOString();

  await serviceSupabase
    .from('jobs')
    .update({ release_reminder_sent_at: nowIso })
    .eq('id', jobId);

  await serviceSupabase.from('notifications').insert({
    user_id: job.customer_id,
    type: 'payment_release_reminder',
    payload: {
      job_id: jobId,
      auto_release_at: job.auto_release_at,
      message: 'Provider requested payment release confirmation.',
    },
  });

  return NextResponse.json({ ok: true, reminded_at: nowIso }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
