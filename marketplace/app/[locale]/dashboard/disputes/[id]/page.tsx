import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import DisputeDetail from '@/components/disputes/DisputeDetail';
import styles from '../../../inner.module.css';

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        <DisputeDetail disputeId={id} />
      </section>
    </main>
  );
}
