import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Heart } from 'lucide-react';
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
      {/* Quick links bar */}
      <div
        className="mx-auto mb-6 flex w-full max-w-7xl flex-wrap gap-3 px-4 pt-6 sm:px-6 lg:px-8"
      >
        <Link
          href={`/${locale}/saved-providers`}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
          style={{
            background: 'var(--wm-surface)',
            border: '1px solid var(--wm-border)',
            color: 'var(--wm-navy)',
          }}
        >
          <Heart className="h-4 w-4" style={{ color: 'var(--wm-primary)' }} />
          Saved Providers
        </Link>
      </div>

      <DashboardShell
        mode="customer"
        title="Customer Dashboard"
        description="Drag widgets to reorder, add what matters most, and keep your layout saved."
      />
    </Shell>
  );
}
