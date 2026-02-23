import { redirect } from 'next/navigation';
import AdminApplicationsPanel from '@/components/dashboard/AdminApplicationsPanel';
import { getUserRole } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../../[locale]/inner.module.css';

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/en/giris');
  }

  const role = await getUserRole(supabase, user.id);
  if (role !== 'admin') {
    redirect('/en/profil');
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <div className={styles.card}>
          <h1>Admin Basvuru Kontrol</h1>
          <p className={styles.muted}>
          Bekleyen hizmet veren basvurularini burada onaylayabilir veya reddedebilirsin.
          </p>
        </div>
      </section>
      <section className={styles.container}>
        <AdminApplicationsPanel />
      </section>
    </main>
  );
}
