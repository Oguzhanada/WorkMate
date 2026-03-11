import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { canAccessProDashboard, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import CreditsPanel from '@/components/credits/CreditsPanel';

export const metadata: Metadata = {
  title: 'Quote Credits — WorkMate',
  description: 'View your quote credit balance and transaction history.',
};

export default async function ProviderCreditsPage({
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
  if (!canAccessProDashboard(roles)) redirect(`/${locale}/profile`);

  return (
    <Shell>
      <PageHeader
        title="Quote Credits"
        description="Credits are used when you submit quotes. Earn more through referrals, monthly grants, and loyalty bonuses."
      />
      <CreditsPanel />
    </Shell>
  );
}
