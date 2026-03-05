import { redirect } from 'next/navigation';
import { canAccessProDashboard, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import Card from '@/components/ui/Card';
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
    <Shell
      header={(
        <Card className="rounded-3xl">
          <h1>Provider Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Arrange widgets around leads, quotes, and task alerts.
          </p>
        </Card>
      )}
    >
      <DashboardShell
        mode="provider"
        title="Provider Dashboard"
        description="Customize your workspace with lead, quote, and alert widgets."
      />
    </Shell>
  );
}
