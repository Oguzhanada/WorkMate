import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getCitiesByCounty } from '@/lib/ireland/locations';
import type { AccountRole } from '../RoleSelector';
import type { EircodeSuggestion, EircodeStatus, FieldErrors, SignUpFormData } from './types';

/* ---------- constants ---------- */

const counties26 = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
] as const;

const prioritizedCounties = ['Dublin', 'Cork', 'Galway'] as const;

export const orderedCounties = [
  ...prioritizedCounties,
  ...counties26.filter((c) => !prioritizedCounties.includes(c as (typeof prioritizedCounties)[number])),
].sort((a, b) => {
  const ai = prioritizedCounties.indexOf(a as (typeof prioritizedCounties)[number]);
  const bi = prioritizedCounties.indexOf(b as (typeof prioritizedCounties)[number]);
  if (ai !== -1 || bi !== -1) {
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  }
  return a.localeCompare(b);
});

/* ---------- hook ---------- */

export type UseEircodeValidationReturn = {
  countyQuery: string;
  setCountyQuery: Dispatch<SetStateAction<string>>;
  eircodeLoading: boolean;
  eircodeSuggestion: EircodeSuggestion | null;
  eircodeDropdownOpen: boolean;
  setEircodeDropdownOpen: Dispatch<SetStateAction<boolean>>;
  cityOptions: string[];
  filteredCounties: string[];
  applyEircodeSuggestion: () => void;
};

export function useEircodeValidation(
  form: SignUpFormData,
  setForm: Dispatch<SetStateAction<SignUpFormData>>,
  role: AccountRole,
  eircodeStatus: EircodeStatus,
  setEircodeStatus: Dispatch<SetStateAction<EircodeStatus>>,
  setErrors: Dispatch<SetStateAction<FieldErrors>>,
): UseEircodeValidationReturn {
  const [countyQuery, setCountyQuery] = useState('');
  const [eircodeLoading, setEircodeLoading] = useState(false);
  const [eircodeSuggestion, setEircodeSuggestion] = useState<EircodeSuggestion | null>(null);
  const [eircodeDropdownOpen, setEircodeDropdownOpen] = useState(false);
  const eircodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cityOptions = useMemo(() => {
    if (!form.county) return [] as string[];
    const fromCounty = getCitiesByCounty(form.county);
    if (fromCounty.length > 0) return fromCounty;
    return [`${form.county} Town`, `${form.county} City`];
  }, [form.county]);

  const filteredCounties = useMemo(() => {
    if (!countyQuery.trim()) return orderedCounties;
    const q = countyQuery.toLowerCase();
    return orderedCounties.filter((county) => county.toLowerCase().includes(q));
  }, [countyQuery]);

  /* Debounced Eircode autocomplete lookup */
  useEffect(() => {
    if (role !== 'provider') return;
    const raw = form.eircode.trim().toUpperCase();
    const compact = raw.replace(/\s/g, '');
    if (compact.length < 7) {
      setEircodeSuggestion(null);
      setEircodeDropdownOpen(false);
      return;
    }
    if (eircodeDebounceRef.current) clearTimeout(eircodeDebounceRef.current);
    eircodeDebounceRef.current = setTimeout(async () => {
      setEircodeLoading(true);
      try {
        const res = await fetch(`/api/address-lookup?eircode=${encodeURIComponent(raw)}`);
        if (!res.ok) { setEircodeSuggestion(null); setEircodeDropdownOpen(false); return; }
        const json = await res.json();
        const addr = json.address ?? {};
        if (addr.line_1 || addr.post_town) {
          setEircodeSuggestion({ line1: addr.line_1 ?? null, line2: addr.line_2 ?? null, postTown: addr.post_town ?? null, county: addr.county ?? null });
          setEircodeDropdownOpen(true);
        } else {
          setEircodeSuggestion(null);
          setEircodeDropdownOpen(false);
          setEircodeStatus('valid');
        }
      } catch { /* ignore */ }
      finally { setEircodeLoading(false); }
    }, 700);
    return () => { if (eircodeDebounceRef.current) clearTimeout(eircodeDebounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.eircode, role]);

  const applyEircodeSuggestion = useCallback(() => {
    if (!eircodeSuggestion) return;
    const updates: Partial<SignUpFormData> = {};
    if (eircodeSuggestion.line1) updates.address1 = eircodeSuggestion.line1;
    if (eircodeSuggestion.line2) updates.address2 = eircodeSuggestion.line2;
    if (eircodeSuggestion.postTown) updates.city = eircodeSuggestion.postTown;
    if (eircodeSuggestion.county) {
      const rawCounty = eircodeSuggestion.county.replace(/^County\s+/i, '').trim();
      const matched = (orderedCounties as readonly string[]).find(
        (c) => c.toLowerCase() === rawCounty.toLowerCase(),
      );
      if (matched) {
        updates.county = matched;
        updates.city = eircodeSuggestion.postTown || updates.city || '';
      }
    }
    setForm((prev) => ({ ...prev, ...updates }));
    setEircodeStatus('valid');
    setEircodeDropdownOpen(false);
    setEircodeSuggestion(null);
    setErrors((prev) => ({ ...prev, eircode: undefined }));
  }, [eircodeSuggestion, setForm, setEircodeStatus, setErrors]);

  return {
    countyQuery,
    setCountyQuery,
    eircodeLoading,
    eircodeSuggestion,
    eircodeDropdownOpen,
    setEircodeDropdownOpen,
    cityOptions,
    filteredCounties,
    applyEircodeSuggestion,
  };
}
