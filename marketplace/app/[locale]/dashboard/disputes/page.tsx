import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import DisputeList from '@/components/disputes/DisputeList';
import styles from '../../inner.module.css';

export default async function DisputesPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <DisputeList />
      </section>
    </main>
  );
}
