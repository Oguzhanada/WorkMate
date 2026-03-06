import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
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
      <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <NotificationsInbox initialItems={(data ?? []) as any[]} />
      </div>
    </Shell>
  );
}
