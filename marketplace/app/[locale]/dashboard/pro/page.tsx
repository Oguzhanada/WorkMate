import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { canAccessProDashboard, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import DashboardShell from '@/components/dashboard/DashboardShell';
import FoundingProBadge from '@/components/ui/FoundingProBadge';

export const metadata: Metadata = {
  title: 'Provider Dashboard',
  description: 'Your WorkMate provider dashboard.',
};

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

  const [{ data: profile }, { data: proServices }] = await Promise.all([
    supabase
      .from('profiles')
      .select('is_founding_pro, id_verification_status')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('pro_services')
      .select('id')
      .eq('profile_id', user.id)
      .limit(1),
  ]);

  const typedProfile = profile as {
    is_founding_pro?: boolean;
    id_verification_status?: string | null;
  } | null;

  const isFoundingPro = !!typedProfile?.is_founding_pro;
  const isIdVerified = typedProfile?.id_verification_status === 'approved';
  const hasServices = (proServices ?? []).length > 0;
  const showCompletionBanner = !isIdVerified || !hasServices;

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

      {showCompletionBanner ? (
        <div
          className="mb-4 rounded-2xl p-4"
          style={{
            background: 'rgba(var(--wm-primary-rgb), 0.07)',
            border: '1px solid rgba(var(--wm-primary-rgb), 0.25)',
            boxShadow: 'var(--wm-shadow-sm)',
          }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--wm-primary-dark)', marginBottom: 6 }}>
            Complete your profile to get more visibility
          </p>
          <ul className="text-sm" style={{ color: 'var(--wm-text)', margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {!isIdVerified ? (
              <li>
                <a href={`/${locale}/profile?focus=id#identity-verification`} style={{ color: 'var(--wm-primary-dark)', textDecoration: 'underline' }}>
                  Verify your identity
                </a>{' '}— required for direct quote requests from customers.
              </li>
            ) : null}
            {!hasServices ? (
              <li>
                <a href={`/${locale}/profile?tab=business#business-details`} style={{ color: 'var(--wm-primary-dark)', textDecoration: 'underline' }}>
                  Add your service categories
                </a>{' '}— so you appear in search results and get matched to jobs.
              </li>
            ) : null}
          </ul>
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
