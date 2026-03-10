import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';

// GET /api/admin/garda-vetting — list providers with garda vetting data
// Supports ?status= filter (pending|approved|rejected|expired|all)
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = getSupabaseServiceClient();
  const statusFilter = request.nextUrl.searchParams.get('status') ?? 'all';

  // Build query — select fields needed for the admin queue
  let query = service
    .from('profiles')
    .select(
      'id,full_name,email,profession,garda_vetting_status,garda_vetting_reference,garda_vetting_expires_at,created_at,updated_at'
    )
    .order('updated_at', { ascending: false });

  // Apply status filter
  if (statusFilter !== 'all') {
    query = query.eq('garda_vetting_status', statusFilter);
  } else {
    // "All" excludes not_required — those are providers who never requested vetting
    query = query.neq('garda_vetting_status', 'not_required');
  }

  const { data: providers, error } = await query.limit(200);

  if (error) {
    return NextResponse.json({ error: 'Failed to load providers' }, { status: 500 });
  }

  // Compute stats across all statuses (unfiltered)
  const { data: allProviders } = await service
    .from('profiles')
    .select('garda_vetting_status')
    .neq('garda_vetting_status', 'not_required');

  const stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    total: 0,
  };

  if (allProviders) {
    for (const p of allProviders) {
      const s = p.garda_vetting_status as keyof typeof stats;
      if (s in stats) stats[s]++;
      stats.total++;
    }
  }

  // Mask emails for display (show first 3 chars + domain)
  const masked = (providers ?? []).map((p) => ({
    ...p,
    email_masked: p.email
      ? p.email.slice(0, 3) + '***@' + p.email.split('@')[1]
      : 'N/A',
  }));

  return NextResponse.json({ providers: masked, stats });
}
