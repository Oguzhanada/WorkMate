import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { bulkReviewRiskSchema } from '@/lib/validation/api';

// GET /api/admin/risk
// Returns all providers with risk_score > 0, ordered by risk_score DESC.
// Optional query param: ?unreviewed=true — only return profiles with risk_reviewed_at IS NULL.
export async function GET(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const unreviewedOnly = searchParams.get('unreviewed') === 'true';

  const svc = getSupabaseServiceClient();

  let query = svc
    .from('profiles')
    .select('id,full_name,email,risk_score,risk_flags,risk_reviewed_at,verification_status')
    .gt('risk_score', 0)
    .order('risk_score', { ascending: false });

  if (unreviewedOnly) {
    query = query.is('risk_reviewed_at', null);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ providers: data ?? [] });
}

// PATCH /api/admin/risk
// Bulk mark-as-reviewed: sets risk_reviewed_at = now() for all given profile IDs.
// Body: { profile_ids: string[] }
export async function PATCH(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bulkReviewRiskSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { profile_ids } = parsed.data;
  const svc = getSupabaseServiceClient();

  const { error: updateError } = await svc
    .from('profiles')
    .update({ risk_reviewed_at: new Date().toISOString() })
    .in('id', profile_ids)
    .gt('risk_score', 0);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ updated: profile_ids.length });
}
