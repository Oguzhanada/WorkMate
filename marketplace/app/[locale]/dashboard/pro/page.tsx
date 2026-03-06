import { redirect } from 'next/navigation';
import { canAccessProDashboard, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function LocalizedProDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessProDashboard(roles)) {
    redirect(`/${locale}/profile`);
  }

  return (
    <Shell>
      <DashboardShell
        mode="provider"
        title="Provider Dashboard"
        description="Customize your workspace with lead, quote, and alert widgets."
      />
    </Shell>
  );
}
