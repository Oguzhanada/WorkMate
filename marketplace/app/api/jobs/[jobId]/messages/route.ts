import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getUserRoles } from '@/lib/auth/rbac';
import { createJobMessageSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/api/error-response';

async function resolveJobAccess(
  supabase: Awaited<ReturnType<typeof getSupabaseRouteClient>>,
  jobId: string,
  userId: string
): Promise<{ allowed: boolean; customerId: string | null; proId: string | null }> {
  const { data: job } = await supabase
    .from('jobs')
    .select('customer_id, accepted_quote_id, status')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) return { allowed: false, customerId: null, proId: null };

  let proId: string | null = null;
  if (job.accepted_quote_id) {
    const { data: quote } = await supabase
      .from('quotes')
      .select('pro_id')
      .eq('id', job.accepted_quote_id)
      .maybeSingle();
    proId = quote?.pro_id ?? null;
  }

  const roles = await getUserRoles(supabase, userId);
  const isAdmin = roles.includes('admin');
  const isParticipant = userId === job.customer_id || userId === proId;

  return { allowed: isParticipant || isAdmin, customerId: job.customer_id, proId };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiUnauthorized();

  const { allowed } = await resolveJobAccess(supabase, jobId, user.id);
  if (!allowed) return apiForbidden();

  const { data, error } = await supabase
    .from('job_messages')
    .select(`
      id, job_id, sender_id, receiver_id, message, message_type, file_url, file_name,
      visibility, created_at,
      sender:profiles!sender_id(full_name, avatar_url)
    `)
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) return apiServerError(error.message);

  return NextResponse.json({ messages: data ?? [] });
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiUnauthorized();

  const { allowed, customerId, proId } = await resolveJobAccess(supabase, jobId, user.id);
  if (!allowed) return apiForbidden();

  let body: unknown;
  try { body = await request.json(); } catch {
    return apiError('Invalid JSON', 400);
  }

  const parsed = createJobMessageSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { message, message_type, file_url, file_name, receiver_id } = parsed.data;

  if (message_type === 'file' && !file_url) {
    return apiError('file_url is required for file messages', 400);
  }

  // Determine receiver: the other participant in the conversation
  const resolvedReceiver = receiver_id ?? (user.id === customerId ? proId : customerId);

  const { data: inserted, error: insertError } = await supabase
    .from('job_messages')
    .insert({
      job_id: jobId,
      sender_id: user.id,
      receiver_id: resolvedReceiver,
      visibility: 'private',
      message,
      message_type,
      file_url: file_url ?? null,
      file_name: file_name ?? null,
    })
    .select('id, job_id, sender_id, receiver_id, message, message_type, file_url, file_name, visibility, created_at')
    .single();

  if (insertError) return apiServerError(insertError.message);

  return NextResponse.json({ message: inserted }, { status: 201 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
