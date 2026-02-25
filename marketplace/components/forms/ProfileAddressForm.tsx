'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './profile-address.module.css';

type Address = {
  address_line_1: string;
  address_line_2?: string | null;
  locality: string;
  county: string;
  eircode: string;
};

export default function ProfileAddressForm({
  initialAddress,
  autoFocusField,
}: {
  initialAddress?: Address | null;
  autoFocusField?: 'address_line_1' | 'locality' | 'county' | 'eircode' | null;
}) {
  const t = useTranslations('profile');
  const [addressLine1, setAddressLine1] = useState(initialAddress?.address_line_1 ?? '');
  const [addressLine2, setAddressLine2] = useState(initialAddress?.address_line_2 ?? '');
  const [locality, setLocality] = useState(initialAddress?.locality ?? '');
  const [county, setCounty] = useState(initialAddress?.county ?? '');
  const [eircode, setEircode] = useState(initialAddress?.eircode ?? '');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const address1Ref = useRef<HTMLInputElement | null>(null);
  const localityRef = useRef<HTMLInputElement | null>(null);
  const countyRef = useRef<HTMLInputElement | null>(null);
  const eircodeRef = useRef<HTMLInputElement | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    setIsPending(true);

    const response = await fetch('/api/profile/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        locality,
        county,
        eircode,
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

  useEffect(() => {
    if (autoFocusField === 'address_line_1') address1Ref.current?.focus();
    if (autoFocusField === 'locality') localityRef.current?.focus();
    if (autoFocusField === 'county') countyRef.current?.focus();
    if (autoFocusField === 'eircode') eircodeRef.current?.focus();
  }, [autoFocusField]);

  return (
    <form onSubmit={onSubmit} className={styles.card}>
      <h3 className={styles.title}>{t('addressTitle')}</h3>
      {feedback ? <p className={`${styles.feedback} ${styles.ok}`}>{feedback}</p> : null}
      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}
      <div className={styles.grid}>
        <label className={`${styles.field} ${styles.span2}`}>
          <span>{t('addressLine1')}</span>
          <input ref={address1Ref} className={styles.input} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
        </label>
        <label className={`${styles.field} ${styles.span2}`}>
          <span>{t('addressLine2')}</span>
          <input className={styles.input} value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>{t('locality')}</span>
          <input ref={localityRef} className={styles.input} value={locality} onChange={(e) => setLocality(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>{t('county')}</span>
          <input ref={countyRef} className={styles.input} value={county} onChange={(e) => setCounty(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>{t('eircode')}</span>
          <input ref={eircodeRef} className={styles.input} value={eircode} onChange={(e) => setEircode(e.target.value)} />
        </label>
      </div>
      <div className={styles.actions}>
        <button type="submit" disabled={isPending} className={styles.save}>
          {isPending ? t('saving') : t('saveAddress')}
        </button>
      </div>
    </form>
  );
}

