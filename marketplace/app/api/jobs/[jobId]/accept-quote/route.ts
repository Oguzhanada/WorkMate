import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { acceptQuoteSchema } from '@/lib/validation/api';
import { sendWebhookEvent } from '@/lib/webhook/send';
import { sendTransactionalEmail } from '@/lib/email/send';
import { sendNotification } from '@/lib/notifications/send';

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

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);
  if (!canPostJob(roles)) {
    return NextResponse.json({ error: 'Only customers can accept quotes' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = acceptQuoteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const quoteId = parsed.data.quote_id;

  const serviceSupabase = getSupabaseServiceClient();

  const { data: job, error: jobError } = await serviceSupabase
    .from('jobs')
    .select('id,title,customer_id,accepted_quote_id')
    .eq('id', jobId)
    .maybeSingle();

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.customer_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: existingPayment } = await serviceSupabase
    .from('payments')
    .select('id')
    .eq('job_id', jobId)
    .in('status', ['authorized', 'captured'])
    .limit(1)
    .maybeSingle();

  if (existingPayment) {
    return NextResponse.json({ error: 'Cannot change accepted quote after payment authorization' }, { status: 400 });
  }

  const { data: quote, error: quoteError } = await serviceSupabase
    .from('quotes')
    .select('id,job_id,pro_id,quote_amount_cents')
    .eq('id', quoteId)
    .eq('job_id', jobId)
    .maybeSingle();

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Quote not found for this job' }, { status: 404 });
  }

  const { error: quoteResetError } = await serviceSupabase
    .from('quotes')
    .update({ status: 'rejected' })
    .eq('job_id', jobId);

  if (quoteResetError) {
    return NextResponse.json({ error: quoteResetError.message }, { status: 400 });
  }

  const { error: quoteAcceptError } = await serviceSupabase
    .from('quotes')
    .update({ status: 'accepted' })
    .eq('id', quoteId)
    .eq('job_id', jobId);

  if (quoteAcceptError) {
    return NextResponse.json({ error: quoteAcceptError.message }, { status: 400 });
  }

  let jobUpdateQuery = serviceSupabase
    .from('jobs')
    .update({ accepted_quote_id: quoteId, status: 'accepted' })
    .eq('id', jobId);

  if (!isAdmin) {
    jobUpdateQuery = jobUpdateQuery.eq('customer_id', user.id);
  }

  const { data: updatedJob, error: jobUpdateError } = await jobUpdateQuery
    .select('id,status,accepted_quote_id')
    .single();

  if (jobUpdateError) {
    return NextResponse.json({ error: jobUpdateError.message }, { status: 400 });
  }

  void sendWebhookEvent('quote.accepted', {
    job_id: jobId,
    quote_id: quoteId,
    accepted_by: user.id,
    accepted_at: new Date().toISOString(),
  });

  // In-app notification to provider — fire-and-forget
  if (quote.pro_id) {
    sendNotification({
      userId: quote.pro_id,
      type: 'job_offer',
      title: 'Your Offer Was Accepted!',
      data: { job_id: jobId },
    });
  }

  // Notify provider their quote was accepted — non-blocking, best-effort
  if (quote.pro_id) {
    void (async () => {
      try {
        const [{ data: providerProfile }, { data: customerProfile }] = await Promise.all([
          serviceSupabase.from('profiles').select('email,full_name').eq('id', quote.pro_id!).maybeSingle(),
          serviceSupabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        ]);
        if (providerProfile?.email) {
          sendTransactionalEmail({
            type: 'quote_accepted',
            to: providerProfile.email,
            jobTitle: job.title ?? 'the job',
            customerName: customerProfile?.full_name ?? 'The customer',
            amountEur: ((quote.quote_amount_cents ?? 0) / 100).toFixed(2),
            jobId,
          });
        }
      } catch {
        // Non-blocking — email lookup failure is swallowed.
      }
    })();
  }

  return NextResponse.json({ job: updatedJob }, { status: 200 });
}
