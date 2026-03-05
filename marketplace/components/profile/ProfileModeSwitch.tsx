"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import styles from '@/app/[locale]/inner.module.css';

type Props = {
  hasProviderRole: boolean;
  customerLabel: string;
  providerLabel: string;
  title: string;
  providerHint: string;
  customerDashboardCta: string;
  providerDashboardCta: string;
  providerSetupCta: string;
  providerInfoCta: string;
  providerStartNowCta: string;
};

export default function ProfileModeSwitch({
  hasProviderRole,
  customerLabel,
  providerLabel,
  title,
  providerHint,
  customerDashboardCta,
  providerDashboardCta,
  providerSetupCta,
  providerInfoCta,
  providerStartNowCta,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);
  const [mode, setMode] = useState<'customer' | 'provider'>('customer');

  return (
    <article className={styles.card}>
      <h2>{title}</h2>
      <div className={styles.tabRow}>
        <button
          type="button"
          className={`${styles.tabButton} ${mode === 'customer' ? styles.activeTab : ''}`}
          onClick={() => setMode('customer')}
        >
          {customerLabel}
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${mode === 'provider' ? styles.activeTab : ''}`}
          onClick={() => setMode('provider')}
        >
          {providerLabel}
        </button>
      </div>

      <div className={styles.actions}>
        {mode === 'customer' ? (
          <button type="button" className={styles.primary} onClick={() => router.push(withLocalePrefix(localeRoot, '/dashboard/customer'))}>
            {customerDashboardCta}
          </button>
        ) : hasProviderRole ? (
          <button type="button" className={styles.primary} onClick={() => router.push(withLocalePrefix(localeRoot, '/dashboard/pro'))}>
            {providerDashboardCta}
          </button>
        ) : (
          <>
            <p className={styles.muted}>{providerHint}</p>
            <button type="button" className={styles.secondary} onClick={() => router.push(withLocalePrefix(localeRoot, '/become-provider'))}>
              {providerInfoCta}
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={() =>
                router.push(withLocalePrefix(localeRoot, '/profile?message=identity_required#identity-verification'))
              }
            >
              {providerStartNowCta}
            </button>
            <button type="button" className={styles.secondary} onClick={() => router.push(withLocalePrefix(localeRoot, '/become-provider'))}>
              {providerSetupCta}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

