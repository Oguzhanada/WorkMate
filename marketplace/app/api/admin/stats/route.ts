import { NextResponse } from 'next/server';

import { ensureAdminRoute } from '@/lib/auth/admin';

export async function GET() {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { supabase } = auth;

  const [profilesCount, pendingCount, approvedCount, rejectedCount, paymentsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'rejected'),
    supabase.from('payments').select('amount_cents,status').eq('status', 'captured'),
  ]);

  const totalUsers = profilesCount.count ?? 0;
  const pendingApps = pendingCount.count ?? 0;
  const approvedApps = approvedCount.count ?? 0;
  const rejectedApps = rejectedCount.count ?? 0;
  const approvalBase = Math.max(approvedApps + rejectedApps, 1);
  const approvalRate = Math.round((approvedApps / approvalBase) * 100);
  const revenueCents = (paymentsResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount_cents ?? 0),
    0
  );

  return NextResponse.json(
    {
      totalUsers,
      pendingApps,
      approvedApps,
      rejectedApps,
      revenue: Math.round(revenueCents / 100),
      approvalRate,
    },
    { status: 200 }
  );
}
