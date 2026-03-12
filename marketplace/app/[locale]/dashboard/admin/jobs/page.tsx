import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import AdminPendingJobsPanel from '@/components/dashboard/AdminPendingJobsPanel';

export const metadata: Metadata = {
  title: 'Job Reviews | Admin | WorkMate',
  description: 'Review and approve pending job listings.',
};

export default async function AdminJobReviewsPage({
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
  if (!canAccessAdmin(roles)) {
    redirect(`/${locale}/profile`);
  }

  return (
    <Shell>
      <AdminPendingJobsPanel />
    </Shell>
  );
}
