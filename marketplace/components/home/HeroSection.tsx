'use client';

import Link from 'next/link';
import { Search, MapPin } from 'lucide-react';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

const counties = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
];

export default function HeroSection() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const [serviceQuery, setServiceQuery] = useState('');
  const [county, setCounty] = useState('Dublin');

  const onSearch = () => {
    const params = new URLSearchParams();
    if (serviceQuery.trim()) params.set('q', serviceQuery.trim());
    if (county) params.set('county', county);
    router.push(withLocalePrefix(localeRoot, `/search?${params.toString()}`));
  };

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #edf3f1 0%, #f3f5f6 62%, #eef3f1 100%)' }} />
      <div className="relative mx-auto max-w-5xl text-center">
        <h1
          className="mx-auto max-w-4xl text-[clamp(2.4rem,6.5vw,5.1rem)] font-extrabold leading-[1.02]"
          style={{ color: 'var(--color-text-primary)', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}
        >
          <span style={{ color: 'var(--color-text-primary)' }}>Find trusted local pros</span>
          <br />
          <span className="text-[var(--wm-primary)]">in Ireland</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,2.2vw,1.35rem)] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Connect with verified professionals for all your home service needs.
        </p>

        <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-[#e5e7eb] bg-white p-2 shadow-[0_10px_28px_rgba(15,23,42,0.09)]">
          <div className="grid gap-2 md:grid-cols-[1fr_300px_140px]">
            <label className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] px-4 py-3.5 text-left">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={serviceQuery}
                onChange={(event) => setServiceQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onSearch();
                  }
                }}
                placeholder="What service do you need?"
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
              />
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] px-4 py-3.5 text-left">
              <MapPin className="h-4 w-4 text-slate-500" />
              <select
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                aria-label="Select county"
              >
                {counties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={onSearch}
              className="rounded-xl bg-[var(--wm-primary)] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[var(--wm-primary-dark)]"
            >
              Search
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={withLocalePrefix(localeRoot, '/post-job')}
            className="rounded-2xl bg-[var(--wm-navy)] px-9 py-3.5 text-base font-semibold text-white shadow-[0_8px_22px_rgba(15,23,42,0.2)] transition hover:bg-[#0b1630]"
          >
            Post a Job
          </Link>
          <Link
            href={withLocalePrefix(localeRoot, '/become-provider')}
            className="rounded-2xl border border-[#cbd5e1] bg-white px-9 py-3.5 text-base font-semibold text-[#334155] shadow-[0_6px_16px_rgba(15,23,42,0.08)] transition hover:border-[var(--wm-primary)] hover:text-[#0f172a]"
          >
            Become a Pro
          </Link>
        </div>
      </div>
    </section>
  );
}

