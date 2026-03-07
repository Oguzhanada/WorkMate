import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveJobAccessContext } from '@/lib/jobs/access';

const createContractSchema = z.object({
  terms: z.string().trim().min(10).max(10000),
  quote_id: z.string().uuid().optional().nullable(),
});

const signContractSchema = z.object({
  action: z.enum(['sign', 'void']),
});

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (!access.isAdmin && !access.isCustomer && !access.isProvider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = getSupabaseServiceClient();
  const { data: contract, error } = await service
    .from('job_contracts')
    .select('id,job_id,quote_id,customer_id,provider_id,terms,status,customer_signed_at,provider_signed_at,created_at,updated_at')
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contract: contract ?? null });
}

// POST /api/jobs/[jobId]/contract — create a contract (customer only)
export async function POST(
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (!access.isCustomer && !access.isAdmin) {
    return NextResponse.json({ error: 'Only the customer can create a contract' }, { status: 403 });
  }
  if (!access.providerId) {
    return NextResponse.json({ error: 'Job must have an accepted provider before creating a contract' }, { status: 400 });
  }

  // Check no contract already exists
  const { data: existing } = await service
    .from('job_contracts')
    .select('id')
    .eq('job_id', jobId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'A contract already exists for this job' }, { status: 409 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createContractSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
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

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  // Notify provider
  await service.from('notifications').insert({
    user_id: access.providerId,
    type: 'contract_sent',
    payload: { contract_id: contract.id, job_id: jobId },
  });

  return NextResponse.json({ contract }, { status: 201 });
}

// PATCH /api/jobs/[jobId]/contract — sign or void
export async function PATCH(
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (!access.isAdmin && !access.isCustomer && !access.isProvider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: contract, error: fetchError } = await service
    .from('job_contracts')
    .select('id,status,customer_id,provider_id,customer_signed_at,provider_signed_at')
    .eq('job_id', jobId)
    .maybeSingle();

  if (fetchError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  if (contract.status === 'voided') {
    return NextResponse.json({ error: 'Contract is already voided' }, { status: 400 });
  }
  if (contract.status === 'signed_both') {
    return NextResponse.json({ error: 'Contract is already fully signed' }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = signContractSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.action === 'void') {
    if (!access.isCustomer && !access.isAdmin) {
      return NextResponse.json({ error: 'Only the customer or admin can void a contract' }, { status: 403 });
    }
    const { data: updated, error: voidError } = await service
      .from('job_contracts')
      .update({ status: 'voided' })
      .eq('id', contract.id)
      .select('id,status')
      .single();
    if (voidError) return NextResponse.json({ error: voidError.message }, { status: 400 });
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
    return NextResponse.json({ error: 'You have already signed this contract' }, { status: 400 });
  }

  const { data: updated, error: signError } = await service
    .from('job_contracts')
    .update(updatePayload)
    .eq('id', contract.id)
    .select('id,job_id,status,customer_signed_at,provider_signed_at,updated_at')
    .single();

  if (signError) return NextResponse.json({ error: signError.message }, { status: 400 });

  return NextResponse.json({ contract: updated });
}
