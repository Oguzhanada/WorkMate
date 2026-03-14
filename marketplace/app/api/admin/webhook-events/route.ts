import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiUnauthorized, apiForbidden, apiServerError } from '@/lib/api/error-response';

// GET /api/admin/webhook-events — list webhook events (failed first)
async function handler(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return apiUnauthorized();

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) return apiForbidden();

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status'); // 'failed' | 'processed' | null (all)
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 100);
  const offset = Number(searchParams.get('offset') || '0');

  const service = getSupabaseServiceClient();
  let query = service
    .from('webhook_events')
    .select('id,stripe_event_id,event_type,status,error_message,processed_at', { count: 'exact' });

  if (statusFilter === 'failed' || statusFilter === 'processed') {
    query = query.eq('status', statusFilter);
  }

  const { data, error, count } = await query
    .order('processed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return apiServerError(error.message);

  return NextResponse.json({ events: data ?? [], total: count ?? 0 });
}

export const GET = withRateLimit(RATE_LIMITS.ADMIN_READ, handler);
