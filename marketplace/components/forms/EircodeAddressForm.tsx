'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

type AutocompleteHit = {
  id: string;
  suggestion: string;
  address_line_1: string;
  address_line_2?: string;
  locality?: string;
  county?: string;
  eircode?: string;
};

export default function EircodeAddressForm({
  value,
  onChange,
}: {
  value: Address;
  onChange: (address: Address) => void;
}) {
  const [query, setQuery] = useState(value.eircode);
  const [hits, setHits] = useState<AutocompleteHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [eircodeError, setEircodeError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);

  const cityOptions = useMemo(() => getCitiesByCounty(value.county ?? ''), [value.county]);

  const reset = (partial: Partial<Address>) => {
    onChange({ ...value, ...partial });
  };

  const acceptHit = (hit: AutocompleteHit) => {
    const eircode = hit.eircode ?? '';
    setQuery(eircode);
    setShowDropdown(false);
    setHits([]);
    setActiveIdx(-1);
    setEircodeError(null);
    onChange({
      ...value,
      eircode,
      eircode_valid: !!eircode,
      address_line_1: hit.address_line_1,
      address_line_2: hit.address_line_2,
      locality: hit.locality,
      county: hit.county,
    });
  };

  // Debounce: fetch suggestions 300ms after typing (skip initial render)
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const q = query.trim();
    if (!q) {
      setHits([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(q)}`);
        const json = await res.json() as { hits: AutocompleteHit[] };
        setHits(json.hits ?? []);
        setShowDropdown((json.hits?.length ?? 0) > 0);
      } catch {
        setHits([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Keep query in sync when value.eircode changes from outside (e.g. initial load)
  useEffect(() => {
    if (value.eircode && value.eircode !== query) {
      setQuery(value.eircode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.eircode]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || !hits.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      acceptHit(hits[activeIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className={styles.addressFormFields}>
      {/* Eircode / address search field */}
      <div style={{ position: 'relative' }} ref={wrapperRef}>
        <label className={styles.field}>
          <span>Eircode or address <span style={{ color: 'var(--wm-error, #ef4444)' }}>*</span></span>
          <input
            className={`${styles.input} ${value.eircode_valid && value.eircode ? styles.inputOk : ''}`}
            value={query}
            placeholder="Type Eircode or address…"
            autoComplete="off"
            onChange={(e) => {
              const v = e.target.value.toUpperCase();
              setQuery(v);
              // If user clears or edits, reset eircode_valid
              if (v !== value.eircode) {
                onChange({ ...value, eircode: v, eircode_valid: false });
              }
              setActiveIdx(-1);
            }}
            onFocus={() => { if (hits.length) setShowDropdown(true); setEircodeError(null); }}
            onBlur={() => {
              if (query.trim() && !value.eircode_valid) {
                setEircodeError('Please select a valid address from the suggestions.');
              }
            }}
            onKeyDown={onKeyDown}
          />
        </label>

        {loading && (
          <p className={styles.muted} style={{ fontSize: '0.8rem', margin: '3px 0 0' }}>
            Searching…
          </p>
        )}
        {eircodeError && !loading && (
          <p style={{ fontSize: '0.75rem', color: 'var(--wm-error, #ef4444)', margin: '3px 0 0' }}>
            {eircodeError}
          </p>
        )}

        {/* Suggestion dropdown */}
        {showDropdown && hits.length > 0 && (
          <div className={styles.suggestionDropdown} role="listbox">
            <p className={styles.suggestionTag} style={{ padding: '7px 12px 4px', margin: 0 }}>
              Select your address
            </p>
            {hits.map((hit, idx) => (
              <button
                key={hit.id}
                type="button"
                role="option"
                aria-selected={idx === activeIdx}
                className={`${styles.suggestionItem} ${idx === activeIdx ? styles.suggestionItemActive : ''}`}
                onMouseDown={(e) => { e.preventDefault(); acceptHit(hit); }}
              >
                <span className={styles.suggestionItemMain}>
                  {hit.address_line_1}
                  {hit.address_line_2 ? `, ${hit.address_line_2}` : ''}
                  {hit.locality ? `, ${hit.locality}` : ''}
                </span>
                {hit.eircode && (
                  <span className={styles.suggestionItemEircode}>{hit.eircode}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Manual fields — editable after auto-fill or for manual entry */}
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
          <span>City / Town</span>
          <select
            className={styles.select}
            value={value.locality ?? ''}
            onChange={(e) => reset({ locality: e.target.value })}
            disabled={!value.county}
          >
            <option value="">Select city / town</option>
            {/* Show auto-filled locality from API even if not in predefined list */}
            {value.locality && !cityOptions.includes(value.locality) && (
              <option key="__api__" value={value.locality}>{value.locality}</option>
            )}
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
