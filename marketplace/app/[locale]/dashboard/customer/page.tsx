import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../../inner.module.css';

export default async function CustomerDashboardPage({
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
    redirect(`/${locale}/giris`);
  }

  const role = await getUserRole(supabase, user.id);
  if (role !== 'customer' && role !== 'admin') {
    redirect(`/${locale}/profil`);
  }

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id,title,category,status,budget_range,eircode,created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <main className={styles.section}>
        <section className={styles.container}>
          <div className={styles.error}>İlanlar yüklenemedi: {error.message}</div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <article className={styles.card}>
          <h1>Verdiğim İlanlar</h1>
          <p className={styles.muted}>Açtığın iş taleplerini buradan takip edebilirsin.</p>
          <Link className={styles.primary} href={`/${locale}/post-job`}>
            Yeni iş talebi oluştur
          </Link>
        </article>
      </section>
      <section className={styles.container}>
        <div className={styles.grid3}>
          {(jobs ?? []).map((job) => (
            <article key={job.id} className={styles.card}>
              <h3>{job.title}</h3>
              <p className={styles.muted}>{job.category} • {job.eircode}</p>
              <p className={styles.muted}>Durum: {job.status}</p>
              <p className={styles.muted}>Bütçe: {job.budget_range}</p>
            </article>
          ))}
        </div>
        {(jobs ?? []).length === 0 ? <p className={styles.muted}>Henüz ilan açmadın.</p> : null}
      </section>
    </main>
  );
}
