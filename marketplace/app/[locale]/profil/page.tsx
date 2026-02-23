import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getTranslations} from 'next-intl/server';

import {isValidLocale} from '@/lib/i18n';
import {getSupabaseServerClient} from '@/lib/supabase/server';
import ProfileAddressForm from '@/components/forms/ProfileAddressForm';
import DeleteAccountPanel from '@/components/profile/DeleteAccountPanel';

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
  const {data: proServices} = await supabase
    .from('pro_services')
    .select('id')
    .eq('profile_id', user.id);
  const {data: proAreas} = await supabase
    .from('pro_service_areas')
    .select('id')
    .eq('profile_id', user.id);
  const {data: address} = await supabase
    .from('addresses')
    .select('address_line_1,address_line_2,locality,county,eircode')
    .eq('profile_id', user.id)
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle();
  const t = await getTranslations({locale, namespace: 'profile'});
  const hasProviderRole = profile?.role === 'verified_pro' || profile?.role === 'admin';
  const leadChecklist = {
    verified: Boolean(profile?.is_verified),
    hasCategory: (proServices?.length ?? 0) > 0,
    hasCounty: (proAreas?.length ?? 0) > 0,
  };
  const canReceiveLeads = leadChecklist.verified && leadChecklist.hasCategory && leadChecklist.hasCounty;

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

        <ProfileAddressForm initialAddress={address} />
        <DeleteAccountPanel />

        {hasProviderRole ? (
          <article className={styles.card}>
            <h2>{t('leadReadinessTitle')}</h2>
            <p className={styles.muted}>
              {canReceiveLeads ? t('leadReadinessReady') : t('leadReadinessMissing')}
            </p>
            <p>{leadChecklist.verified ? '[OK]' : '[MISSING]'} {t('leadCheckVerified')}</p>
            <p>{leadChecklist.hasCategory ? '[OK]' : '[MISSING]'} {t('leadCheckCategory')}</p>
            <p>{leadChecklist.hasCounty ? '[OK]' : '[MISSING]'} {t('leadCheckCounty')}</p>
            {!canReceiveLeads ? (
              <div className={styles.actions}>
                <Link className={styles.primary} href={`/${locale}/hizmet-ver`}>
                  {t('leadFixCta')}
                </Link>
              </div>
            ) : null}
          </article>
        ) : null}

        <section className={styles.section}>
          <h2>{t('actionsTitle')}</h2>
          <div className={styles.grid3}>
            <Link className={styles.primary} href={`/${locale}/post-job`}>
              {t('postJob')}
            </Link>
            <Link className={styles.primary} href={`/${locale}/dashboard/customer`}>
              {t('customerDashboard')}
            </Link>
            <Link className={styles.primary} href={`/${locale}/hizmet-ver`}>
              {t('becomeProvider')}
            </Link>
            <Link className={styles.primary} href={`/${locale}/dashboard/pro`}>
              {t('proDashboard')}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
