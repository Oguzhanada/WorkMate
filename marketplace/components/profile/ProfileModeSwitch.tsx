"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
          <button type="button" className={styles.primary} onClick={() => router.push('/dashboard/customer')}>
            {customerDashboardCta}
          </button>
        ) : hasProviderRole ? (
          <button type="button" className={styles.primary} onClick={() => router.push('/dashboard/pro')}>
            {providerDashboardCta}
          </button>
        ) : (
          <>
            <p className={styles.muted}>{providerHint}</p>
            <button type="button" className={styles.secondary} onClick={() => router.push('/become-provider')}>
              {providerInfoCta}
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={() => router.push('/profile?message=identity_required#identity-verification')}
            >
              {providerStartNowCta}
            </button>
            <button type="button" className={styles.secondary} onClick={() => router.push('/become-provider')}>
              {providerSetupCta}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

