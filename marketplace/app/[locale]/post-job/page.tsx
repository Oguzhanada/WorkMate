import { redirect } from 'next/navigation';
import JobMultiStepForm from '@/components/forms/JobMultiStepForm';
import GuestJobIntentForm from '@/components/forms/GuestJobIntentForm';
import { getUserRole } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../inner.module.css';

export default async function LocalizedPostJobPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    role = await getUserRole(supabase, user.id);
    if (role !== 'customer' && role !== 'admin') {
      redirect(`/${locale}/profil`);
    }
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <div className={styles.card}>
          <h1>Is Talebi Olustur</h1>
          <p className={styles.muted}>
          Talep detayini net girerek daha dogru ve hizli teklif alabilirsin.
          </p>
        </div>
      </section>
      <section className={styles.formWrap}>
        {user && (role === 'customer' || role === 'admin') ? (
          <JobMultiStepForm customerId={user.id} />
        ) : (
          <GuestJobIntentForm />
        )}
      </section>
    </main>
  );
}
