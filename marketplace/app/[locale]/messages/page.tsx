import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../inner.module.css';

export default async function MessagesPage({
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
    redirect(`/login`);
  }

  const { data: messages } = await supabase
    .from('job_messages')
    .select('id,job_id,quote_id,sender_id,receiver_id,message,created_at')
    .eq('visibility', 'private')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <article className={styles.card}>
          <h1>Private Messages</h1>
          <p className={styles.muted}>Private conversations started from quote threads.</p>
        </article>
      </section>
      <section className={styles.container}>
        <div className={styles.grid3}>
          {(messages ?? []).map((item) => (
            <article key={item.id} className={styles.card}>
              <p className={styles.muted}>Job: {item.job_id}</p>
              <p className={styles.muted}>Quote: {item.quote_id ?? '-'}</p>
              <p>{item.message}</p>
              <p className={styles.muted}>{new Date(item.created_at).toLocaleString()}</p>
            </article>
          ))}
        </div>
        {(messages ?? []).length === 0 ? <p className={styles.muted}>No private messages yet.</p> : null}
      </section>
    </main>
  );
}

