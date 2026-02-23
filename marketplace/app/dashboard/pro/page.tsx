import { redirect } from 'next/navigation';
import ProDashboard from '@/components/dashboard/ProDashboard';
import { getUserRole, isProRole } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../../[locale]/inner.module.css';

export default async function ProDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/en/giris');
  }

  const role = await getUserRole(supabase, user.id);
  if (!isProRole(role)) {
    redirect('/en/profil');
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <div className={styles.card}>
          <h1>Pro Paneli</h1>
          <p className={styles.muted}>
          Acik isleri takip et, teklif ver ve bildirimlerini buradan yonet.
          </p>
        </div>
      </section>
      <section className={styles.container}>
        <ProDashboard profileId={user.id} />
      </section>
    </main>
  );
}
