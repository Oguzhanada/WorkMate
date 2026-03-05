'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react';

const IRISH_COUNTIES = [
  'All counties',
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry', 'Kildare',
  'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath',
  'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
];

export type AdvancedFilters = {
  start_date: string;
  end_date: string;
  id_verification_status: 'all' | 'none' | 'pending' | 'approved' | 'rejected';
  has_documents: 'any' | 'yes' | 'no';
  county: string;
  status: 'all' | 'pending' | 'verified' | 'rejected';
  review_type: 'all' | 'provider_application' | 'customer_identity_review' | 'other';
};

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  start_date: '',
  end_date: '',
  id_verification_status: 'all',
  has_documents: 'any',
  county: 'all',
  status: 'all',
  review_type: 'all',
};

type Props = {
  value: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  onApply: (filters: AdvancedFilters) => void;
  onReset: () => void;
  activeCount: number;
};

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  max,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: string;
  min?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        min={min}
        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
    </div>
  );
}

export default function AdvancedSearchFilters({
  value,
  onChange,
  onApply,
  onReset,
  activeCount,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const set = <K extends keyof AdvancedFilters>(key: K, val: AdvancedFilters[K]) => {
    onChange({ ...value, [key]: val });
  };

  const countyOptions = IRISH_COUNTIES.map((c) => ({
    value: c === 'All counties' ? 'all' : c,
    label: c,
  }));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          <Search className="h-4 w-4 text-zinc-500" />
          Advanced Filters
          {activeCount > 0 ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              {activeCount} active
            </span>
          ) : null}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      {expanded ? (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {/* Application status */}
            <SelectField
              label="Application status"
              value={value.status}
              onChange={(v) => set('status', v as AdvancedFilters['status'])}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'verified', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />

            {/* Review type */}
            <SelectField
              label="Review type"
              value={value.review_type}
              onChange={(v) => set('review_type', v as AdvancedFilters['review_type'])}
              options={[
                { value: 'all', label: 'All types' },
                { value: 'provider_application', label: 'Provider application' },
                { value: 'customer_identity_review', label: 'Customer ID review' },
                { value: 'other', label: 'Other' },
              ]}
            />

            {/* ID verification status */}
            <SelectField
              label="ID verification status"
              value={value.id_verification_status}
              onChange={(v) => set('id_verification_status', v as AdvancedFilters['id_verification_status'])}
              options={[
                { value: 'all', label: 'Any verification status' },
                { value: 'none', label: 'Not started' },
                { value: 'pending', label: 'Pending review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />

            {/* County */}
            <SelectField
              label="County"
              value={value.county}
              onChange={(v) => set('county', v)}
              options={countyOptions}
            />

            {/* Has documents */}
            <SelectField
              label="Documents uploaded"
              value={value.has_documents}
              onChange={(v) => set('has_documents', v as AdvancedFilters['has_documents'])}
              options={[
                { value: 'any', label: 'Any' },
                { value: 'yes', label: 'Has documents' },
                { value: 'no', label: 'No documents' },
              ]}
            />

            {/* Date range — start */}
            <DateField
              label="Applied from"
              value={value.start_date}
              max={value.end_date || today}
              onChange={(v) => set('start_date', v)}
            />

            {/* Date range — end */}
            <DateField
              label="Applied to"
              value={value.end_date}
              min={value.start_date}
              max={today}
              onChange={(v) => set('end_date', v)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onApply(value)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Search className="h-3.5 w-3.5" />
              Apply filters
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
