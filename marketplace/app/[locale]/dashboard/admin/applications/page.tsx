import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import AdminApplicationsPanel from '@/components/dashboard/AdminApplicationsPanel';

export const metadata: Metadata = {
  title: 'Provider Applications — WorkMate Admin',
};

export default async function AdminApplicationsPage({
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
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <PageHeader
          title="Provider Applications"
          description="Review and action pending provider and identity verification requests."
          action={
            <Button href={`/${locale}/dashboard/admin`} variant="secondary" size="sm">
              Back to Dashboard
            </Button>
          }
        />
        <AdminApplicationsPanel />
      </div>
    </Shell>
  );
}
