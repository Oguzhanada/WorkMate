import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminApplicationDetail from '@/components/dashboard/AdminApplicationDetail';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../../../../inner.module.css';

export const metadata: Metadata = {
  title: 'Application Review',
  description: 'Review provider application details.',
};

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
    redirect(`/${locale}/login`);
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    redirect(`/${locale}/profile`);
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <div className={styles.card}>
          <h1>Application Details</h1>
          <p className={styles.muted}>Profile ID: {id}</p>
          <Link className={styles.primary} href={`/${locale}/dashboard/admin`}>
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

