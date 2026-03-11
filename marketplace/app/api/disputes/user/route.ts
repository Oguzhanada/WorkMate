import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { apiError, apiUnauthorized } from '@/lib/api/error-response';

export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);

  let query = supabase
    .from('disputes')
    .select('id,job_id,status,dispute_type,payment_status,resolution_deadline,created_at,created_by')
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    const { data: relatedJobs } = await supabase
      .from('jobs')
      .select('id,accepted_quote_id,customer_id')
      .or(`customer_id.eq.${user.id},accepted_quote_id.not.is.null`)
      .limit(500);

    const relevantJobIds = new Set<string>();
    for (const row of relatedJobs ?? []) {
      if (row.customer_id === user.id) relevantJobIds.add(row.id);
      if (row.accepted_quote_id) {
        const { data: quote } = await supabase
          .from('quotes')
          .select('pro_id')
          .eq('id', row.accepted_quote_id)
          .maybeSingle();
        if (quote?.pro_id === user.id) relevantJobIds.add(row.id);
      }
    }

    if (relevantJobIds.size === 0) {
      return NextResponse.json({ disputes: [] }, { status: 200 });
    }

    query = query.in('job_id', Array.from(relevantJobIds));
  }

  const { data, error } = await query;
  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json({ disputes: data ?? [] }, { status: 200 });
}