import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { canAccessAdmin, canAccessProDashboard, canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import type { CustomerDashboardData } from '@/components/dashboard/types';

export const metadata: Metadata = {
  title: 'Customer Dashboard',
  description: 'Your WorkMate customer dashboard.',
};

export default async function CustomerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const roles = await getUserRoles(supabase, user.id);
  if (canAccessAdmin(roles)) redirect(`/${locale}/dashboard/admin`);
  if (canAccessProDashboard(roles)) redirect(`/${locale}/dashboard/pro`);
  if (!canPostJob(roles)) redirect(`/${locale}/profile`);

  const [
    { data: profile },
    { count: openJobs },
    { count: completedJobs },
    { count: activeQuotes },
    { count: savedProviders },
    { data: recentJobs },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('customer_id', user.id).eq('status', 'open'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('customer_id', user.id).eq('status', 'completed'),
    supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      .in('job_id', (await supabase.from('jobs').select('id').eq('customer_id', user.id)).data?.map((j) => j.id) ?? []),
    supabase.from('favourite_providers').select('*', { count: 'exact', head: true }).eq('customer_id', user.id),
    supabase.from('jobs').select('id, title, status, created_at').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(6),
  ]);

  const data: CustomerDashboardData = {
    fullName: (profile as { full_name?: string | null } | null)?.full_name ?? null,
    openJobs: openJobs ?? 0,
    completedJobs: completedJobs ?? 0,
    activeQuotes: activeQuotes ?? 0,
    savedProviders: savedProviders ?? 0,
    recentJobs: (recentJobs ?? []) as CustomerDashboardData['recentJobs'],
  };

  return <CustomerDashboard data={data} locale={locale} />;
}
