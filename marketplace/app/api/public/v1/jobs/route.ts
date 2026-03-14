import { NextRequest, NextResponse } from 'next/server';
import { authenticatePublicRequest } from '@/lib/api/public-auth';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { publicJobsQuerySchema } from '@/lib/validation/api';
import { apiError, apiServerError } from '@/lib/api/error-response';
import { withRequestId } from '@/lib/request-id/middleware';

export const GET = withRequestId(async function GET(request: NextRequest) {
  const auth = await authenticatePublicRequest(request);
  if (auth.error) return auth.error;

  const search = request.nextUrl.searchParams;
  const parsed = publicJobsQuerySchema.safeParse({
    limit: search.get('limit'),
    offset: search.get('offset'),
    status: search.get('status') || undefined,
    county: search.get('county') || undefined,
    category: search.get('category') || undefined,
  });

  if (!parsed.success) {
    return apiError('Invalid query parameters', 400);
  }

  const { limit, offset, status, county, category } = parsed.data;

  const svc = getSupabaseServiceClient();
  let query = svc
    .from('jobs')
    .select('id,title,category,description,county,locality,budget_range,status,created_at,expires_at')
    .eq('review_status', 'approved')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (county) query = query.eq('county', county);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) {
    return apiServerError(error.message);
  }

  return NextResponse.json(
    {
      jobs: data ?? [],
      pagination: { limit, offset, count: (data ?? []).length },
    },
    { status: 200 }
  );
});
