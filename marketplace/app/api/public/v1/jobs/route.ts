import { NextRequest, NextResponse } from 'next/server';
import { authenticatePublicRequest } from '@/lib/api/public-auth';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const auth = await authenticatePublicRequest(request);
  if (auth.error) return auth.error;

  const search = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(search.get('limit') ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
  const offset = Math.max(Number(search.get('offset') ?? 0), 0);
  const status = search.get('status');
  const county = search.get('county');
  const category = search.get('category');

  const svc = getSupabaseServiceClient();
  let query = svc
    .from('jobs')
    .select('id,title,category,description,county,locality,budget_range,status,created_at')
    .eq('review_status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (county) query = query.eq('county', county);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      jobs: data ?? [],
      pagination: { limit, offset, count: (data ?? []).length },
    },
    { status: 200 }
  );
}
