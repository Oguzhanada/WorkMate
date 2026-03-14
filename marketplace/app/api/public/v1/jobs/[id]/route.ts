import { NextRequest, NextResponse } from 'next/server';
import { authenticatePublicRequest } from '@/lib/api/public-auth';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiNotFound, apiServerError } from '@/lib/api/error-response';
import { withRequestId } from '@/lib/request-id/middleware';

export const GET = withRequestId(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticatePublicRequest(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const svc = getSupabaseServiceClient();

  const { data, error } = await svc
    .from('jobs')
    .select('id,title,category,description,county,locality,budget_range,status,created_at')
    .eq('id', id)
    .eq('review_status', 'approved')
    .maybeSingle();

  if (error) return apiServerError(error.message);
  if (!data) return apiNotFound('Job not found');

  return NextResponse.json({ job: data }, { status: 200 });
});
