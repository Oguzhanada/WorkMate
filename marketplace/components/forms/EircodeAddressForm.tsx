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

export default function EircodeAddressForm({ onAddressSelect }: { onAddressSelect: (address: Address | null) => void }) {
  const [eircode, setEircode] = useState('');
  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cityOptions = useMemo(() => getCitiesByCounty(county), [county]);

  const invalidateSelection = () => {
    setSuccess('');
    onAddressSelect(null);
  };

  const validateAndUse = async () => {
    if (!eircode.trim() || !county || !city || !addressLine1.trim()) {
      setError('Eircode, county, city, and address line 1 are required.');
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
      setError(data.error || 'Invalid Eircode format');
      return;
    }

    const normalized = data?.address?.eircode ?? eircode.trim().toUpperCase();
    setEircode(normalized);
    setSuccess('Eircode format validated.');

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
        onChange={(e) => {
          setEircode(e.target.value.toUpperCase());
          invalidateSelection();
        }}
        placeholder="D02 X285"
      />
      </label>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <span>County</span>
          <select
            className={styles.select}
            value={county}
            onChange={(e) => {
              setCounty(e.target.value);
              setCity('');
              invalidateSelection();
            }}
          >
            <option value="">Select county</option>
            {IRISH_COUNTIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <span>City</span>
          <select
            className={styles.select}
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              invalidateSelection();
            }}
            disabled={!county}
          >
            <option value="">Select city</option>
            {cityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className={styles.field}>
        <span>Address line 1</span>
        <input
          value={addressLine1}
          onChange={(e) => {
            setAddressLine1(e.target.value);
            invalidateSelection();
          }}
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span>Address line 2 (optional)</span>
        <input
          value={addressLine2}
          onChange={(e) => {
            setAddressLine2(e.target.value);
            invalidateSelection();
          }}
          className={styles.input}
        />
      </label>

      <div className={styles.buttonRow}>
        <button type="button" onClick={validateAndUse} disabled={loading} className={styles.primary}>
          {loading ? 'Validating...' : 'Validate Eircode and Use Address'}
        </button>
      </div>

      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}
      {success ? <p className={`${styles.feedback} ${styles.ok}`}>{success}</p> : null}
    </div>
  );
}
