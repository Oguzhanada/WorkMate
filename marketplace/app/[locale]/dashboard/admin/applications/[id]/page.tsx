import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminApplicationDetail from '@/components/dashboard/AdminApplicationDetail';
import { getUserRole } from '@/lib/auth/rbac';
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
    redirect(`/${locale}/giris`);
  }

  const role = await getUserRole(supabase, user.id);
  if (role !== 'admin') {
    redirect(`/${locale}/profil`);
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <div className={styles.card}>
          <h1>Başvuru Detayı</h1>
          <p className={styles.muted}>Profil ID: {id}</p>
          <Link className={styles.primary} href={`/${locale}/dashboard/admin`}>
            Panele geri dön
          </Link>
        </div>
      </section>
      <section className={styles.container}>
        <AdminApplicationDetail profileId={id} />
      </section>
    </main>
  );
}
