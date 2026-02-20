import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getTranslations} from 'next-intl/server';

import {isValidLocale} from '@/lib/i18n';
import {getSupabaseServerClient} from '@/lib/supabase/server';

import styles from '../inner.module.css';

export default async function ProfilePage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!isValidLocale(locale)) return null;

  const supabase = await getSupabaseServerClient();
  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/giris`);
  }

  const {data: profile} = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const t = await getTranslations({locale, namespace: 'profile'});

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <article className={styles.card}>
          <h1>{t('title')}</h1>
          <p className={styles.muted}>{t('subtitle')}</p>

          <div className={styles.grid3}>
            <div>
              <p className={styles.muted}>{t('fullName')}</p>
              <p>{profile?.full_name ?? '-'}</p>
            </div>
            <div>
              <p className={styles.muted}>{t('email')}</p>
              <p>{user.email ?? '-'}</p>
            </div>
            <div>
              <p className={styles.muted}>{t('phone')}</p>
              <p>{profile?.phone ?? '-'}</p>
            </div>
            <div>
              <p className={styles.muted}>{t('role')}</p>
              <p>{profile?.role ?? '-'}</p>
            </div>
            <div>
              <p className={styles.muted}>{t('status')}</p>
              <p>{profile?.verification_status ?? '-'}</p>
            </div>
          </div>
        </article>

        <section className={styles.section}>
          <h2>{t('actionsTitle')}</h2>
          <div className={styles.grid3}>
            <Link className={styles.primary} href={`/post-job`}>
              {t('postJob')}
            </Link>
            <Link className={styles.primary} href={`/${locale}/hizmet-ver`}>
              {t('becomeProvider')}
            </Link>
            <Link className={styles.primary} href={`/dashboard/pro`}>
              {t('proDashboard')}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
