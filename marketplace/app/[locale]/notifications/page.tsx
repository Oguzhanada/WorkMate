import {redirect} from 'next/navigation';
import {getSupabaseServerClient} from '@/lib/supabase/server';
import NotificationsInbox from '@/components/profile/NotificationsInbox';
import styles from '../inner.module.css';

export default async function NotificationsPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const {data} = await supabase
    .from('notifications')
    .select('id,type,payload,created_at,read_at')
    .eq('user_id', user.id)
    .order('created_at', {ascending: false})
    .limit(100);

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <article className={styles.card}>
          <h1>Notifications inbox</h1>
          <p className={styles.muted}>All admin and system notifications are listed here.</p>
          <NotificationsInbox initialItems={(data ?? []) as any[]} />
        </article>
      </section>
    </main>
  );
}
