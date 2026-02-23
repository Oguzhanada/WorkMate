'use client';

import { useMemo, useState } from 'react';
import { IRISH_COUNTIES, getCitiesByCounty } from '@/lib/ireland-locations';
import styles from './forms.module.css';

type Address = {
  address_line_1: string;
  address_line_2?: string;
  locality?: string;
  county?: string;
  eircode: string;
};

export default function EircodeAddressForm({ onAddressSelect }: { onAddressSelect: (address: Address) => void }) {
  const [eircode, setEircode] = useState('');
  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cityOptions = useMemo(() => getCitiesByCounty(county), [county]);

  const validateAndUse = async () => {
    if (!eircode.trim() || !county || !city || !addressLine1.trim()) {
      setError('Eircode, ilce, sehir ve adres satiri 1 zorunlu.');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const res = await fetch(`/api/address-lookup?eircode=${encodeURIComponent(eircode)}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Eircode formati gecersiz');
      return;
    }

    const normalized = data?.address?.eircode ?? eircode.trim().toUpperCase();
    setEircode(normalized);
    setSuccess('Eircode formati dogrulandi.');

    onAddressSelect({
      address_line_1: addressLine1.trim(),
      address_line_2: addressLine2.trim() || undefined,
      locality: city,
      county,
      eircode: normalized,
    });
  };

  return (
    <div className={styles.card}>
      <label className={styles.field}>
        <span>Eircode</span>
      <input
        className={styles.input}
        value={eircode}
        onChange={(e) => setEircode(e.target.value.toUpperCase())}
        placeholder="D02 X285"
      />
      </label>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <span>Ilce (County)</span>
          <select
            className={styles.select}
            value={county}
            onChange={(e) => {
              setCounty(e.target.value);
              setCity('');
            }}
          >
            <option value="">Ilce sec</option>
            {IRISH_COUNTIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <span>Sehir</span>
          <select
            className={styles.select}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!county}
          >
            <option value="">Sehir sec</option>
            {cityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className={styles.field}>
        <span>Adres satiri 1</span>
        <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className={styles.input} />
      </label>

      <label className={styles.field}>
        <span>Adres satiri 2 (opsiyonel)</span>
        <input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className={styles.input} />
      </label>

      <div className={styles.buttonRow}>
        <button type="button" onClick={validateAndUse} disabled={loading} className={styles.primary}>
          {loading ? 'Dogrulaniyor...' : 'Eircode Dogrula ve Adresi Kullan'}
        </button>
      </div>

      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}
      {success ? <p className={`${styles.feedback} ${styles.ok}`}>{success}</p> : null}
    </div>
  );
}
