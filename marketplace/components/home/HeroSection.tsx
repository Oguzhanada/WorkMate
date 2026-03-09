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
      <div className="absolute inset-0" style={{ background: 'var(--wm-grad-hero)' }} />
      <div className="relative mx-auto max-w-5xl text-center">
        <h1
          className="mx-auto max-w-4xl text-[clamp(2.4rem,6.5vw,5.1rem)] font-extrabold leading-[1.02]"
          style={{ color: 'var(--wm-navy)', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}
        >
          <span style={{ color: 'var(--wm-navy)' }}>Find trusted local pros</span>
          <br />
          <span className="text-[var(--wm-primary)]">in Ireland</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,2.2vw,1.35rem)] leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
          Connect with verified professionals for all your home service needs.
        </p>

        <div
          className="mx-auto mt-10 max-w-4xl rounded-2xl p-2"
          style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)', boxShadow: 'var(--wm-shadow-lg)' }}
        >
          <div className="grid gap-2 md:grid-cols-[1fr_300px_140px]">
            <label
              className="flex items-center gap-2 rounded-xl px-4 py-3.5 text-left"
              style={{ border: '1px solid var(--wm-border)' }}
            >
              <Search className="h-4 w-4" style={{ color: 'var(--wm-muted)' }} />
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
                className="w-full border-none bg-transparent text-sm outline-none"
                style={{ color: 'var(--wm-text-default)' }}
              />
            </label>

            <label
              className="flex items-center gap-2 rounded-xl px-4 py-3.5 text-left"
              style={{ border: '1px solid var(--wm-border)' }}
            >
              <MapPin className="h-4 w-4" style={{ color: 'var(--wm-muted)' }} />
              <select
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                className="w-full border-none bg-transparent text-sm outline-none"
                style={{ color: 'var(--wm-text-default)' }}
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
            className="rounded-2xl bg-[var(--wm-navy)] px-9 py-3.5 text-base font-semibold text-white transition hover:bg-[var(--wm-navy-mid)]"
            style={{ boxShadow: 'var(--wm-shadow-lg)' }}
          >
            Post a Job
          </Link>
          <Link
            href={withLocalePrefix(localeRoot, '/become-provider')}
            className="rounded-2xl px-9 py-3.5 text-base font-semibold transition hover:border-[var(--wm-primary)]"
            style={{
              border: '1px solid var(--wm-border)',
              background: 'var(--wm-surface)',
              color: 'var(--wm-text-default)',
              boxShadow: 'var(--wm-shadow-sm)',
            }}
          >
            Become a Pro
          </Link>
        </div>
      </div>
    </section>
  );
}
