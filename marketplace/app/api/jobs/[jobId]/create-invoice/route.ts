import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { resolveJobAccessContext } from '@/lib/jobs/access';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound, apiConflict, apiServerError } from '@/lib/api/error-response';

function computeBillableCents(minutes: number, hourlyRateCents: number) {
  return Math.round((minutes / 60) * hourlyRateCents);
}

async function getOrCreateStripeCustomer(customerId: string, fallbackEmail: string | null) {
  if (!fallbackEmail) {
    throw new Error('Customer email is missing. Cannot create Stripe invoice.');
  }

  const existing = await stripe.customers.search({
    query: `metadata['workmate_customer_id']:'${customerId}'`,
    limit: 1,
  });

  if (existing.data.length > 0) return existing.data[0].id;

  const created = await stripe.customers.create({
    email: fallbackEmail,
    metadata: { workmate_customer_id: customerId },
  });
  return created.id;
}

async function postHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();
  const service = getSupabaseServiceClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiUnauthorized();

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return apiNotFound('Job not found');
  if (!access.isProvider && !access.isAdmin) {
    return apiForbidden('Only the assigned provider can create invoices.');
  }

  const { data: job, error: jobError } = await service
    .from('jobs')
    .select('id,title,status,customer_id,accepted_quote_id,stripe_invoice_id')
    .eq('id', jobId)
    .maybeSingle();

  if (jobError || !job) return apiNotFound('Job not found');
  if (!job.accepted_quote_id) return apiError('No accepted quote found for this job.', 400);
  if (job.stripe_invoice_id) {
    return apiConflict('Invoice already exists for this job.');
  }

  const [{ data: acceptedQuote }, { data: entries, error: entryError }] = await Promise.all([
    service.from('quotes').select('id,pro_id,quote_amount_cents').eq('id', job.accepted_quote_id).maybeSingle(),
    service
      .from('time_entries')
      .select('id,started_at,ended_at,duration_minutes,hourly_rate,description,approved')
      .eq('job_id', jobId)
      .eq('provider_id', access.providerId ?? '')
      .eq('approved', true)
      .not('ended_at', 'is', null),
  ]);

  if (!acceptedQuote) return apiError('Accepted quote is missing.', 400);
  if (!access.isAdmin && acceptedQuote.pro_id !== user.id) {
    return apiForbidden('Only the assigned provider can create invoices.');
  }
  if (entryError) return apiServerError(entryError.message);
  if (!entries || entries.length === 0) {
    return apiError('No approved time entries available for invoicing.', 400);
  }

  const defaultRate = acceptedQuote.quote_amount_cents;
  const preparedLines = entries
    .map((entry) => {
      const minutes = entry.duration_minutes ?? 0;
      const rate = entry.hourly_rate ?? defaultRate;
      const amount = computeBillableCents(minutes, rate);
      return {
        id: entry.id,
        minutes,
        rate,
        amount,
        description:
          entry.description?.trim() ||
          `Time entry on ${new Date(entry.started_at).toLocaleDateString('en-IE')} (${minutes} min)`,
      };
    })
    .filter((line) => line.amount > 0);

  if (preparedLines.length === 0) {
    return apiError('Approved entries contain zero billable amount.', 400);
  }

  const totalAmount = preparedLines.reduce((sum, line) => sum + line.amount, 0);

  try {
    const { data: authUserResult, error: authUserError } = await service.auth.admin.getUserById(job.customer_id);
    if (authUserError) return apiServerError(authUserError.message);
    const customerEmail = authUserResult.user?.email ?? null;
    const stripeCustomerId = await getOrCreateStripeCustomer(job.customer_id, customerEmail);

    for (const line of preparedLines) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        currency: 'eur',
        amount: line.amount,
        description: line.description,
        metadata: {
          workmate_job_id: jobId,
          workmate_time_entry_id: line.id,
        },
      });
    }

    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: 7,
      currency: 'eur',
      metadata: {
        workmate_job_id: jobId,
        workmate_customer_id: job.customer_id,
        workmate_provider_id: acceptedQuote.pro_id,
      },
      description: `WorkMate invoice for ${job.title}`,
    });

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    if (finalized.status === 'open') {
      await stripe.invoices.sendInvoice(finalized.id);
    }

    await service
      .from('jobs')
      .update({
        stripe_invoice_id: finalized.id,
        invoiced_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    await service.from('notifications').insert({
      user_id: job.customer_id,
      type: 'invoice_created',
      payload: {
        job_id: jobId,
        stripe_invoice_id: finalized.id,
        amount_cents: totalAmount,
        line_items: preparedLines.length,
      },
    });

    return NextResponse.json(
      {
        stripe_invoice_id: finalized.id,
        hosted_invoice_url: finalized.hosted_invoice_url,
        invoice_pdf: finalized.invoice_pdf,
        amount_cents: totalAmount,
        line_items: preparedLines.length,
      },
      { status: 201 }
    );
  } catch (error) {
    return apiServerError(error instanceof Error ? error.message : 'Invoice creation failed.');
  }
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
