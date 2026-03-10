'use client';

import { useMemo, useState } from 'react';
import { IRISH_COUNTIES, getCitiesByCounty } from '@/lib/ireland/locations';
import styles from './forms.module.css';

export type Address = {
  address_line_1: string;
  address_line_2?: string;
  locality?: string;
  county?: string;
  eircode: string;
  eircode_valid?: boolean;
};

export default function EircodeAddressForm({
  value,
  onChange,
}: {
  value: Address;
  onChange: (address: Address) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cityOptions = useMemo(() => getCitiesByCounty(value.county ?? ''), [value.county]);

  const invalidateSelection = (partial: Partial<Address>) => {
    setSuccess('');
    onChange({
      ...value,
      ...partial,
      eircode_valid: partial.eircode_valid ?? false,
    });
  };

  const validateEircode = async () => {
    const eircode = value.eircode.trim().toUpperCase();
    if (!eircode) {
      setError('Eircode is required. This is important for matching providers in your area.');
      onChange({...value, eircode_valid: false});
      return;
    }

    if (!/^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/.test(eircode)) {
      setError('Invalid Eircode format. This is important and must be corrected before continuing.');
      onChange({...value, eircode_valid: false});
      return;
    }
    setError('');
    setSuccess('');
    const normalized = eircode.length === 7 ? `${eircode.slice(0, 3)} ${eircode.slice(3)}` : eircode;
    setSuccess('Eircode format looks valid.');
    onChange({
      ...value,
      eircode: normalized,
      eircode_valid: true,
    });
  };

  return (
    <div className={styles.card}>
      <label className={styles.field}>
        <span>Eircode</span>
      <input
        className={`${styles.input} ${error ? styles.inputError : ''} ${value.eircode_valid ? styles.inputOk : ''}`}
        value={value.eircode}
        onChange={(e) => {
          setError('');
          invalidateSelection({ eircode: e.target.value.toUpperCase() });
        }}
        onBlur={validateEircode}
        placeholder="D02 X285"
      />
      </label>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <span>County</span>
          <select
            className={styles.select}
            value={value.county ?? ''}
            onChange={(e) => {
              invalidateSelection({ county: e.target.value, locality: '' });
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
            value={value.locality ?? ''}
            onChange={(e) => {
              invalidateSelection({ locality: e.target.value });
            }}
            disabled={!value.county}
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
          value={value.address_line_1}
          onChange={(e) => {
            invalidateSelection({ address_line_1: e.target.value });
          }}
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span>Address line 2 (optional)</span>
        <input
          value={value.address_line_2 ?? ''}
          onChange={(e) => {
            invalidateSelection({ address_line_2: e.target.value });
          }}
          className={styles.input}
        />
      </label>
      {loading ? <p className={styles.muted}>Validating Eircode...</p> : null}

      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}
      {success ? <p className={`${styles.feedback} ${styles.ok}`}>{success}</p> : null}
    </div>
  );
}
