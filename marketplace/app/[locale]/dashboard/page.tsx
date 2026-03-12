import { redirect } from 'next/navigation';
import { canAccessAdmin, canAccessProDashboard, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardRootPage({
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

  if (canAccessAdmin(roles)) {
    redirect(`/${locale}/dashboard/admin`);
  }

  if (canAccessProDashboard(roles)) {
    redirect(`/${locale}/dashboard/pro`);
  }

  redirect(`/${locale}/dashboard/customer`);
}
