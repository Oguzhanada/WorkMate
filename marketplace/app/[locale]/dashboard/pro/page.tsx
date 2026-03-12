import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { canAccessProDashboard, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import ProDashboard from '@/components/dashboard/ProDashboard';
import type { ProDashboardData } from '@/components/dashboard/types';

export const metadata: Metadata = {
  title: 'Provider Dashboard',
  description: 'Your WorkMate provider dashboard.',
};

export default async function LocalizedProDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessProDashboard(roles)) redirect(`/${locale}/profile`);

  const [
    { data: profile },
    { data: proServices },
    { count: pendingAlerts },
    { count: activeJobs },
    { count: completedJobs },
    { data: reviewData },
    { data: creditsData },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, is_founding_pro, id_verification_status').eq('id', user.id).maybeSingle(),
    supabase.from('pro_services').select('id').eq('profile_id', user.id).limit(1),
    supabase.from('task_alerts').select('*', { count: 'exact', head: true }).eq('provider_id', user.id).eq('status', 'pending'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')
      .in('id', (await supabase.from('job_contracts').select('job_id').eq('provider_id', user.id)).data?.map((c) => c.job_id) ?? []),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed')
      .in('id', (await supabase.from('job_contracts').select('job_id').eq('provider_id', user.id)).data?.map((c) => c.job_id) ?? []),
    supabase.from('reviews').select('rating').eq('provider_id', user.id),
    supabase.from('provider_credits').select('balance').eq('provider_id', user.id).maybeSingle(),
  ]);

  const typedProfile = profile as { full_name?: string | null; is_founding_pro?: boolean; id_verification_status?: string | null } | null;
  const reviews = (reviewData ?? []) as { rating: number }[];
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  const data: ProDashboardData = {
    fullName: typedProfile?.full_name ?? null,
    isFoundingPro: !!typedProfile?.is_founding_pro,
    isIdVerified: typedProfile?.id_verification_status === 'approved',
    hasServices: (proServices ?? []).length > 0,
    pendingAlerts: pendingAlerts ?? 0,
    activeJobs: activeJobs ?? 0,
    completedJobs: completedJobs ?? 0,
    totalEarnings: ((creditsData as { balance?: number } | null)?.balance ?? 0) * 100,
    avgRating,
    reviewCount: reviews.length,
  };

  return <ProDashboard data={data} locale={locale} />;
}
