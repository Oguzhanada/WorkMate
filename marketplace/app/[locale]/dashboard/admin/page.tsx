import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import type { AdminDashboardData } from '@/components/dashboard/types';

export const metadata: Metadata = {
  title: 'Admin — WorkMate',
  description: 'WorkMate admin control centre.',
};

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);
  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) redirect(`/${locale}/profile`);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  const [
    { count: pros },
    { count: customers },
    { count: openJobs },
    { count: activeJobs },
    { count: completedJobs },
    { count: pendingVerification },
    { count: rejectedVerification },
    { count: pendingDocs },
    { count: totalReviews },
    { count: activeSubs },
    { count: newUsers7d },
    { count: auditTotal },
    { data: recentAuditLogs },
    { data: featureFlags },
    { data: regRows },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'verified_pro'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('id_verification_status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('id_verification_status', 'rejected'),
    supabase.from('pro_documents').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('provider_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('admin_audit_logs').select('*', { count: 'exact', head: true }),
    supabase.from('admin_audit_logs').select('action, target_type, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('feature_flags').select('flag_key, enabled').order('flag_key'),
    supabase.from('profiles').select('created_at').gte('created_at', sevenDaysAgo),
  ]);

  // Build weekly registrations map (last 7 days, grouped by day)
  const nowMs = now.getTime();
  const dayMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowMs - i * 86400000);
    dayMap[d.toISOString().split('T')[0]] = 0;
  }
  for (const row of regRows ?? []) {
    const day = (row.created_at as string).split('T')[0];
    if (day in dayMap) dayMap[day]++;
  }
  const weeklyRegistrations = Object.entries(dayMap).map(([isoDay, count]) => ({
    day: new Date(isoDay).toLocaleDateString('en-IE', { weekday: 'short' }),
    count,
  }));

  const dateLabel = now.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const data: AdminDashboardData = {
    pros: pros ?? 0,
    customers: customers ?? 0,
    openJobs: openJobs ?? 0,
    activeJobs: activeJobs ?? 0,
    completedJobs: completedJobs ?? 0,
    pendingVerification: pendingVerification ?? 0,
    rejectedVerification: rejectedVerification ?? 0,
    pendingDocs: pendingDocs ?? 0,
    totalReviews: totalReviews ?? 0,
    activeSubs: activeSubs ?? 0,
    newUsers7d: newUsers7d ?? 0,
    auditTotal: auditTotal ?? 0,
    recentAuditLogs: (recentAuditLogs ?? []) as AdminDashboardData['recentAuditLogs'],
    featureFlags: (featureFlags ?? []) as AdminDashboardData['featureFlags'],
    weeklyRegistrations,
    dateLabel,
  };

  return <AdminDashboard data={data} locale={locale} />;
}
