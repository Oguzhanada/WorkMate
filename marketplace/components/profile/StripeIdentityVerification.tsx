'use client';

import {useMemo, useState} from 'react';
import {usePathname} from 'next/navigation';

import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';
import styles from './profile-verification.module.css';

type Props = {
  stripeIdentityStatus: string;
};

export default function StripeIdentityVerification({ stripeIdentityStatus }: Props) {
  const pathname = usePathname() || '/';
  const localeRoot = useMemo(() => getLocaleRoot(pathname), [pathname]);
  const [status, setStatus] = useState(stripeIdentityStatus || 'not_started');
  const [feedback, setFeedback] = useState('');
  const [isPending, setIsPending] = useState(false);

  const startVerification = async () => {
    setIsPending(true);
    setFeedback('');
    const response = await fetch('/api/connect/create-identity-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        return_url: `${window.location.origin}${withLocalePrefix(localeRoot, '/profile')}`
      }),
    });
    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setFeedback(payload.error || 'Stripe Identity session could not be created.');
      return;
    }

    setStatus('processing');
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    setFeedback('Stripe Identity session created. Continue in hosted flow.');
  };

  return (
    <div className={styles.actions}>
      <button type="button" className={styles.secondary} onClick={startVerification} disabled={isPending}>
        {isPending ? 'Starting...' : 'Verify with Stripe Identity'}
      </button>
      <span className={styles.hint}>Stripe Identity status: {status}</span>
      {feedback ? <p className={styles.error}>{feedback}</p> : null}
    </div>
  );
}
