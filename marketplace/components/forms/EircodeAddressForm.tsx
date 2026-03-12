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

/** Normalize county string from IdealPostcodes to match IRISH_COUNTIES list */
function normalizeCounty(raw: string): string {
  // IdealPostcodes may return "County Cork" or "Cork" — strip prefix
  return raw.replace(/^county\s+/i, '').trim();
}

export default function EircodeAddressForm({
  value,
  onChange,
}: {
  value: Address;
  onChange: (address: Address) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cityOptions = useMemo(() => getCitiesByCounty(value.county ?? ''), [value.county]);

  const reset = (partial: Partial<Address>) => {
    setError('');
    onChange({ ...value, ...partial, eircode_valid: partial.eircode_valid ?? false });
  };

  const lookupEircode = async () => {
    const raw = value.eircode.trim().toUpperCase();

    if (!raw) {
      setError('Eircode is required to match providers in your area.');
      onChange({ ...value, eircode_valid: false });
      return;
    }

    // Basic format check before hitting the API
    if (!/^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/.test(raw)) {
      setError('Invalid Eircode format — should look like D02 X285.');
      onChange({ ...value, eircode_valid: false });
      return;
    }

    const normalized = raw.length === 7 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/address-lookup?eircode=${encodeURIComponent(normalized)}`);
      const json = await res.json() as {
        address?: {
          line_1?: string | null;
          line_2?: string | null;
          post_town?: string | null;
          county?: string | null;
        };
        provider?: string;
        error?: string;
      };

      if (!res.ok || json.error) {
        // Not found but format is valid — user can fill manually
        onChange({ ...value, eircode: normalized, eircode_valid: true });
        return;
      }

      const addr = json.address ?? {};
      const updates: Partial<Address> = { eircode: normalized, eircode_valid: true };

      if (addr.county) {
        const matched = normalizeCounty(addr.county);
        if ((IRISH_COUNTIES as readonly string[]).includes(matched)) updates.county = matched;
      }
      if (addr.post_town) updates.locality = addr.post_town;
      if (addr.line_1)    updates.address_line_1 = addr.line_1;
      if (addr.line_2)    updates.address_line_2 = addr.line_2;

      onChange({ ...value, ...updates });
    } catch {
      // Network error — still accept the eircode, let user fill manually
      onChange({ ...value, eircode: normalized, eircode_valid: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <label className={styles.field}>
        <span>Eircode</span>
        <input
          className={`${styles.input} ${error ? styles.inputError : ''} ${value.eircode_valid ? styles.inputOk : ''}`}
          value={value.eircode}
          placeholder="D02 X285"
          onChange={(e) => {
            setError('');
            reset({ eircode: e.target.value.toUpperCase() });
          }}
          onBlur={lookupEircode}
        />
      </label>

      {loading ? (
        <p className={styles.muted} style={{ fontSize: '0.82rem' }}>
          Looking up address…
        </p>
      ) : null}
      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <span>County</span>
          <select
            className={styles.select}
            value={value.county ?? ''}
            onChange={(e) => reset({ county: e.target.value, locality: '' })}
          >
            <option value="">Select county</option>
            {IRISH_COUNTIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <span>City</span>
          <select
            className={styles.select}
            value={value.locality ?? ''}
            onChange={(e) => reset({ locality: e.target.value })}
            disabled={!value.county}
          >
            <option value="">Select city</option>
            {cityOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <label className={styles.field}>
        <span>Address line 1</span>
        <input
          value={value.address_line_1}
          onChange={(e) => reset({ address_line_1: e.target.value })}
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span>Address line 2 (optional)</span>
        <input
          value={value.address_line_2 ?? ''}
          onChange={(e) => reset({ address_line_2: e.target.value })}
          className={styles.input}
        />
      </label>
    </div>
  );
}
