import { redirect } from 'next/navigation';
import { canAccessProDashboard, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import DashboardShell from '@/components/dashboard/DashboardShell';
import FoundingProBadge from '@/components/ui/FoundingProBadge';

export default async function LocalizedProDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ tour?: string }>;
}) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : undefined;
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_founding_pro')
    .eq('id', user.id)
    .maybeSingle();

  const isFoundingPro = !!(profile as { is_founding_pro?: boolean } | null)?.is_founding_pro;

  return (
    <Shell>
      {isFoundingPro ? (
        <div
          className="mb-4 flex items-center gap-3 rounded-2xl p-4"
          style={{
            background: 'var(--wm-grad-warm, linear-gradient(135deg, var(--wm-amber-light), var(--wm-primary-faint)))',
            border: '1px solid var(--wm-amber)',
            boxShadow: 'var(--wm-shadow-sm)',
          }}
        >
          <FoundingProBadge size="md" />
          <p className="text-sm font-medium" style={{ color: 'var(--wm-amber-dark)' }}>
            You are one of our Founding Pros — thank you for being an early supporter of WorkMate!
          </p>
        </div>
      ) : null}
      <DashboardShell
        mode="provider"
        title="Provider Dashboard"
        description="Customize your workspace with lead, quote, and alert widgets."
        showTourBanner={query?.tour === '1'}
      />
    </Shell>
  );
}
