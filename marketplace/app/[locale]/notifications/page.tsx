import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Your WorkMate notifications.',
};
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import NotificationsInbox from '@/components/profile/NotificationsInbox';

export default async function NotificationsPage({
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

  const { data } = await supabase
    .from('notifications')
    .select('id,type,payload,created_at,read_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <Shell header={<PageHeader title="Notifications" description="All admin and system notifications are listed here." />}>
      <div
        className="rounded-2xl p-5"
        style={{
          border: '1px solid var(--wm-border)',
          background: 'var(--wm-surface)',
          boxShadow: 'var(--wm-shadow-md)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <NotificationsInbox initialItems={(data ?? []) as any[]} />
      </div>
    </Shell>
  );
}
