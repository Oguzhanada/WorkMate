import { redirect } from 'next/navigation';
import AdminDashboardShell from '@/components/dashboard/AdminDashboardShell';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../../[locale]/inner.module.css';

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    redirect('/profile');
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <AdminDashboardShell adminEmail={user.email ?? 'Admin'} />
      </section>
    </main>
  );
}

