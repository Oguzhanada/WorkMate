import { redirect } from 'next/navigation';
import JobMultiStepForm from '@/components/forms/JobMultiStepForm';
import GuestJobIntentForm from '@/components/forms/GuestJobIntentForm';
import { canPostJobWithIdentity, getUserRoles } from '@/lib/auth/rbac';
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

  let canCreate = false;
  if (user) {
    const [{ data: profile }, roles] = await Promise.all([
      supabase.from('profiles').select('id_verification_status').eq('id', user.id).maybeSingle(),
      getUserRoles(supabase, user.id),
    ]);
    canCreate = canPostJobWithIdentity(roles, profile?.id_verification_status);
    if (!canCreate) {
      redirect(`/profile?message=identity_required`);
    }
  }

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <div className={styles.card}>
          <h1>Create Job Request</h1>
          <p className={styles.muted}>
          Share clear details to receive faster and more accurate quotes.
          </p>
        </div>
      </section>
      <section className={styles.formWrap}>
        {user && canCreate ? (
          <JobMultiStepForm customerId={user.id} />
        ) : (
          <GuestJobIntentForm />
        )}
      </section>
    </main>
  );
}

