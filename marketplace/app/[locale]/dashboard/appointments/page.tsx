import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getUserRoles, canAccessAdmin, canAccessProDashboard, canPostJob } from '@/lib/auth/rbac';
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import AppointmentsView from '@/components/appointments/AppointmentsView';

export const metadata: Metadata = {
  title: 'Appointments',
  description: 'Manage your WorkMate appointments.',
};

export default async function AppointmentsPage({
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

  const isProvider = canAccessProDashboard(roles);
  const isCustomer = canPostJob(roles);

  if (!isProvider && !isCustomer) redirect(`/${locale}/profile`);

  const role: 'customer' | 'provider' = isProvider ? 'provider' : 'customer';

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <PageHeader
          title="Appointments"
          description="View and manage your upcoming appointments."
        />
        <AppointmentsView role={role} />
      </div>
    </Shell>
  );
}
