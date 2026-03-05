import { redirect } from 'next/navigation';
import { canAccessAdmin, canAccessProDashboard, canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
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
  if (canAccessAdmin(roles)) redirect(`/${locale}/dashboard/admin`);
  if (canAccessProDashboard(roles)) redirect(`/${locale}/dashboard/pro`);
  if (!canPostJob(roles)) redirect(`/${locale}/profile`);

  return (
    <Shell>
      <DashboardShell
        mode="customer"
        title="Customer Dashboard"
        description="Drag widgets to reorder, add what matters most, and keep your layout saved."
      />
    </Shell>
  );
}
