import { NextRequest, NextResponse } from 'next/server';
import { authenticatePublicRequest } from '@/lib/api/public-auth';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiNotFound } from '@/lib/api/error-response';

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticatePublicRequest(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const svc = getSupabaseServiceClient();

  const { data, error } = await svc
    .from('webhook_subscriptions')
    .delete()
    .eq('id', id)
    .eq('profile_id', auth.profileId)
    .select('id')
    .maybeSingle();

  if (error) return apiError(error.message, 400);
  if (!data) return apiNotFound('Subscription not found');

  return NextResponse.json({ success: true, id: data.id }, { status: 200 });
}

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
