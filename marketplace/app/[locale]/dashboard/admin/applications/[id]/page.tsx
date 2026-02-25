import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminApplicationDetail from '@/components/dashboard/AdminApplicationDetail';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../../../../inner.module.css';

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login`);
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    redirect(`/profile`);
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <div className={styles.card}>
          <h1>Application Details</h1>
          <p className={styles.muted}>Profile ID: {id}</p>
          <Link className={styles.primary} href={`/dashboard/admin`}>
            Back to dashboard
          </Link>
        </div>
      </section>
      <section className={styles.container}>
        <AdminApplicationDetail profileId={id} />
      </section>
    </main>
  );
}

