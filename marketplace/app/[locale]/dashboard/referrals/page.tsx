import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import ReferralPanel from '@/components/referrals/ReferralPanel';

export const metadata: Metadata = {
  title: 'Referrals — WorkMate',
  description: 'Share your referral code and earn credits when friends join WorkMate.',
};

export default async function ReferralsPage({
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

  return (
    <Shell>
      <PageHeader
        title="Referrals"
        description="Share your unique referral code. When a new provider signs up with your code, you earn 10 bonus credits."
      />
      <ReferralPanel />
    </Shell>
  );
}
