'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import EircodeAddressForm, { type Address } from './EircodeAddressForm';
import styles from './profile-address.module.css';

export default function ProfileAddressForm({
  initialAddress,
}: {
  initialAddress?: {
    address_line_1?: string;
    address_line_2?: string | null;
    locality?: string;
    county?: string;
    eircode?: string;
  } | null;
  autoFocusField?: 'address_line_1' | 'locality' | 'county' | 'eircode' | null;
}) {
  const t = useTranslations('profile');
  const [address, setAddress] = useState<Address>({
    address_line_1: initialAddress?.address_line_1 ?? '',
    address_line_2: initialAddress?.address_line_2 ?? '',
    locality: initialAddress?.locality ?? '',
    county: initialAddress?.county ?? '',
    eircode: initialAddress?.eircode ?? '',
    eircode_valid: !!initialAddress?.eircode,
  });
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    setIsPending(true);

    const response = await fetch('/api/profile/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2,
        locality: address.locality,
        county: address.county,
        eircode: address.eircode,
      }),
    });

    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setError(payload.error || t('addressSaveError'));
      return;
    }

    setFeedback(t('addressSaved'));
  };

  return (
    <form onSubmit={onSubmit} className={styles.card}>
      <h3 className={styles.title}>{t('addressTitle')}</h3>
      {feedback ? <p className={`${styles.feedback} ${styles.ok}`}>{feedback}</p> : null}
      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}

      <EircodeAddressForm value={address} onChange={setAddress} />

      <div className={styles.actions}>
        <button type="submit" disabled={isPending} className={styles.save}>
          {isPending ? t('saving') : t('saveAddress')}
        </button>
      </div>
    </form>
  );
}
