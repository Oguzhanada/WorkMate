import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveJobAccessContext } from '@/lib/jobs/access';
import { sendTransactionalEmail } from '@/lib/email/send';
import { sendNotification } from '@/lib/notifications/send';
import { createContractSchema, signContractSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound, apiConflict, apiServerError } from '@/lib/api/error-response';

// GET /api/jobs/[jobId]/contract — get the contract for this job
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
    return apiUnauthorized();
  }

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return apiNotFound('Job not found');
  if (!access.isAdmin && !access.isCustomer && !access.isProvider) {
    return apiForbidden();
  }

  const service = getSupabaseServiceClient();
  const { data: contract, error } = await service
    .from('job_contracts')
    .select('id,job_id,quote_id,customer_id,provider_id,terms,status,customer_signed_at,provider_signed_at,created_at,updated_at')
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) return apiServerError(error.message);

  return NextResponse.json({ contract: contract ?? null });
}

// POST /api/jobs/[jobId]/contract — create a contract (customer only)
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();
  const service = getSupabaseServiceClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return apiNotFound('Job not found');
  if (!access.isCustomer && !access.isAdmin) {
    return apiForbidden('Only the customer can create a contract');
  }
  if (!access.providerId) {
    return apiError('Job must have an accepted provider before creating a contract', 400);
  }

  // Check no contract already exists
  const { data: existing } = await service
    .from('job_contracts')
    .select('id')
    .eq('job_id', jobId)
    .maybeSingle();

  if (existing) {
    return apiConflict('A contract already exists for this job');
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = createContractSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { data: contract, error: insertError } = await service
    .from('job_contracts')
    .insert({
      job_id: jobId,
      quote_id: parsed.data.quote_id ?? null,
      customer_id: access.customerId!,
      provider_id: access.providerId,
      terms: parsed.data.terms,
      status: 'sent',
    })
    .select('id,job_id,quote_id,customer_id,provider_id,terms,status,customer_signed_at,provider_signed_at,created_at,updated_at')
    .single();

  if (insertError) return apiError(insertError.message, 400);

  // Notify provider
  await service.from('notifications').insert({
    user_id: access.providerId,
    type: 'contract_sent',
    payload: { contract_id: contract.id, job_id: jobId },
  });

  // In-app notification — fire-and-forget
  sendNotification({
    userId: access.providerId!,
    type: 'contract_created',
    title: 'New Contract Awaiting Your Signature',
    data: { job_id: jobId, contract_id: contract.id },
  });

  // Email provider — fire-and-forget
  void (async () => {
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';
      const LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en';
      const [{ data: providerProfile }, { data: customerProfile }, { data: jobRow }] = await Promise.all([
        service.from('profiles').select('email,full_name').eq('id', access.providerId!).maybeSingle(),
        service.from('profiles').select('full_name').eq('id', access.customerId!).maybeSingle(),
        service.from('jobs').select('title').eq('id', jobId).maybeSingle(),
      ]);
      if (providerProfile?.email) {
        sendTransactionalEmail({
          type: 'contract_created',
          to: providerProfile.email,
          providerName: providerProfile.full_name ?? 'Provider',
          customerName: customerProfile?.full_name ?? 'Customer',
          jobTitle: jobRow?.title ?? 'the job',
          contractUrl: `${BASE_URL}/${LOCALE}/jobs/${jobId}`,
        });
      }
    } catch {
      // Non-blocking — email lookup failure is swallowed.
    }
  })();

  return NextResponse.json({ contract }, { status: 201 });
}

// PATCH /api/jobs/[jobId]/contract — sign or void
async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();
  const service = getSupabaseServiceClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return apiNotFound('Job not found');
  if (!access.isAdmin && !access.isCustomer && !access.isProvider) {
    return apiForbidden();
  }

  const { data: contract, error: fetchError } = await service
    .from('job_contracts')
    .select('id,status,customer_id,provider_id,customer_signed_at,provider_signed_at')
    .eq('job_id', jobId)
    .maybeSingle();

  if (fetchError || !contract) {
    return apiNotFound('Contract not found');
  }

  if (contract.status === 'voided') {
    return apiError('Contract is already voided', 400);
  }
  if (contract.status === 'signed_both') {
    return apiError('Contract is already fully signed', 400);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = signContractSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  if (parsed.data.action === 'void') {
    if (!access.isCustomer && !access.isAdmin) {
      return apiForbidden('Only the customer or admin can void a contract');
    }
    const { data: updated, error: voidError } = await service
      .from('job_contracts')
      .update({ status: 'voided' })
      .eq('id', contract.id)
      .select('id,status')
      .single();
    if (voidError) return apiError(voidError.message, 400);

    // In-app notifications for both parties — fire-and-forget
    sendNotification({
      userId: contract.customer_id,
      type: 'contract_voided',
      title: 'Contract Voided',
      data: { job_id: jobId },
    });
    sendNotification({
      userId: contract.provider_id,
      type: 'contract_voided',
      title: 'Contract Voided',
      data: { job_id: jobId },
    });

    // Email both parties — fire-and-forget
    void (async () => {
      try {
        const BASE_URL = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';
        const LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en';
        const [{ data: customerProfile }, { data: providerProfile }, { data: jobRow }] = await Promise.all([
          service.from('profiles').select('email,full_name').eq('id', contract.customer_id).maybeSingle(),
          service.from('profiles').select('email,full_name').eq('id', contract.provider_id).maybeSingle(),
          service.from('jobs').select('title').eq('id', jobId).maybeSingle(),
        ]);
        const jobTitle = jobRow?.title ?? 'the job';
        const contractUrl = `${BASE_URL}/${LOCALE}/jobs/${jobId}`;
        void contractUrl; // contractUrl not needed for voided email but kept for consistency
        if (customerProfile?.email) {
          sendTransactionalEmail({
            type: 'contract_voided',
            to: customerProfile.email,
            recipientName: customerProfile.full_name ?? 'Customer',
            jobTitle,
          });
        }
        if (providerProfile?.email) {
          sendTransactionalEmail({
            type: 'contract_voided',
            to: providerProfile.email,
            recipientName: providerProfile.full_name ?? 'Provider',
            jobTitle,
          });
        }
      } catch {
        // Non-blocking — email lookup failure is swallowed.
      }
    })();

    return NextResponse.json({ contract: updated });
  }

  // Sign
  const now = new Date().toISOString();
  const updatePayload: Record<string, string | null> = {};

  if (user.id === contract.customer_id && !contract.customer_signed_at) {
    updatePayload.customer_signed_at = now;
  } else if (user.id === contract.provider_id && !contract.provider_signed_at) {
    updatePayload.provider_signed_at = now;
  } else {
    return apiError('You have already signed this contract', 400);
  }

  const { data: updated, error: signError } = await service
    .from('job_contracts')
    .update(updatePayload)
    .eq('id', contract.id)
    .select('id,job_id,status,customer_signed_at,provider_signed_at,updated_at')
    .single();

  if (signError) return apiError(signError.message, 400);

  // In-app notification — notify the customer when provider signs (or provider when customer signs)
  if (updatePayload.provider_signed_at) {
    sendNotification({
      userId: contract.customer_id,
      type: 'contract_signed',
      title: 'Contract Signed',
      data: { job_id: jobId, contract_id: contract.id },
    });
  } else if (updatePayload.customer_signed_at) {
    sendNotification({
      userId: contract.provider_id,
      type: 'contract_signed',
      title: 'Contract Signed',
      data: { job_id: jobId, contract_id: contract.id },
    });
  }

  // If provider just signed, email the customer — fire-and-forget
  if (updatePayload.provider_signed_at) {
    void (async () => {
      try {
        const BASE_URL = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';
        const LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en';
        const [{ data: customerProfile }, { data: jobRow }] = await Promise.all([
          service.from('profiles').select('email,full_name').eq('id', contract.customer_id).maybeSingle(),
          service.from('jobs').select('title').eq('id', jobId).maybeSingle(),
        ]);
        if (customerProfile?.email) {
          sendTransactionalEmail({
            type: 'contract_signed',
            to: customerProfile.email,
            customerName: customerProfile.full_name ?? 'Customer',
            jobTitle: jobRow?.title ?? 'the job',
            contractUrl: `${BASE_URL}/${LOCALE}/jobs/${jobId}`,
          });
        }
      } catch {
        // Non-blocking — email lookup failure is swallowed.
      }
    })();
  }

  return NextResponse.json({ contract: updated });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
