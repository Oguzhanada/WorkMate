import { redirect } from 'next/navigation';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import Card from '@/components/ui/Card';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/en/login');
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    redirect('/en/profile');
  }

  return (
    <Shell
      header={(
        <Card className="rounded-3xl">
          <h1>Admin Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Customize your moderation and operations widgets.
          </p>
        </Card>
      )}
    >
      <DashboardShell
        mode="admin"
        title="Admin Dashboard"
        description="Configure review, analytics, and operations widgets for your workflow."
      />
    </Shell>
  );
}
