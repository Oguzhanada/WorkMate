import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';

// ─── GET /api/admin/audit-logs ────────────────────────────────────────────────
// Returns admin_audit_logs newest-first.
// Query params:
//   ?limit=50           number of rows (1–200, default 50)
//   ?action=            filter by action string (exact match)
//   ?admin_id=          filter by admin_user_id (UUID)
//   ?days=7|30|all      filter by created_at recency (default 30)
//   ?offset=0           pagination offset (default 0)

export async function GET(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { supabase } = auth;
  const { searchParams } = new URL(request.url);

  // ── Parse query params ──────────────────────────────────────────────────────
  const rawLimit  = parseInt(searchParams.get('limit')  ?? '50', 10);
  const rawOffset = parseInt(searchParams.get('offset') ?? '0',  10);
  const limit     = Number.isFinite(rawLimit)  ? Math.min(Math.max(rawLimit,  1), 200) : 50;
  const offset    = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0)                : 0;
  const action    = searchParams.get('action')   ?? '';
  const adminId   = searchParams.get('admin_id') ?? '';
  const days      = searchParams.get('days')     ?? '30';

  // ── Build query ─────────────────────────────────────────────────────────────
  let query = supabase
    .from('admin_audit_logs')
    .select(
      'id, admin_user_id, admin_email, action, target_type, target_profile_id, target_label, details, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) {
    query = query.eq('action', action);
  }

  if (adminId) {
    query = query.eq('admin_user_id', adminId);
  }

  if (days !== 'all') {
    const daysNum = parseInt(days, 10);
    if (Number.isFinite(daysNum) && daysNum > 0) {
      const since = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', since);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
