import { redirect } from 'next/navigation';
import ProDashboard from '@/components/dashboard/ProDashboard';
import { canAccessProDashboard, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../../inner.module.css';

export default async function LocalizedProDashboardPage({
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

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessProDashboard(roles)) {
    redirect(`/profile`);
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <div className={styles.card}>
          <h1>Pro Dashboard</h1>
          <p className={styles.muted}>
          Track open jobs, submit quotes, and manage notifications from one place.
          </p>
        </div>
      </section>
      <section className={styles.container}>
        <ProDashboard profileId={user.id} />
      </section>
    </main>
  );
}

