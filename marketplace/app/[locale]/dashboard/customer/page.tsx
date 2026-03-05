import { redirect } from 'next/navigation';
import { canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import Card from '@/components/ui/Card';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function CustomerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const roles = await getUserRoles(supabase, user.id);
  if (!canPostJob(roles)) redirect(`/${locale}/profile`);

  return (
    <Shell
      header={(
        <Card className="rounded-3xl">
          <h1>Customer Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Build your own dashboard layout with draggable widgets.
          </p>
        </Card>
      )}
    >
      <DashboardShell
        mode="customer"
        title="Customer Dashboard"
        description="Drag widgets to reorder, add what matters most, and keep your layout saved."
      />
    </Shell>
  );
}
