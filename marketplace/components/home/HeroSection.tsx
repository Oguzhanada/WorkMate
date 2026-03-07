'use client';

import {motion} from 'framer-motion';
import Link from 'next/link';
import {MapPin, Search, X, Loader2} from 'lucide-react';
import {useEffect, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';

import {heroItemVariants, heroStaggerContainer} from '@/styles/animations';
import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';
import {getTaxonomySuggestions} from '@/lib/service-taxonomy';

const counties = [
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry',
  'Donegal', 'Down', 'Dublin', 'Fermanagh', 'Galway', 'Kerry', 'Kildare',
  'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo',
  'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary',
  'Tyrone', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow'
];

const stats = [
  {value: 1000, suffix: '+', label: 'Trusted Pros', emoji: '🛠️'},
  {value: 100, suffix: '%', label: 'Insured Services', emoji: '🛡️'},
  {value: 100, suffix: '%', label: 'Secure Payments', emoji: '🔒'}
];

const fallbackServiceSuggestions = getTaxonomySuggestions();

function Counter({target, suffix = ''}: {target: number; suffix?: string}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 1000;
    const interval = 16;
    const steps = duration / interval;
    const increment = target / steps;
    const timer = window.setInterval(() => {
      frame += 1;
      const next = Math.min(target, Math.round(frame * increment));
      setValue(next);
      if (next >= target) window.clearInterval(timer);
    }, interval);
    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <span className="font-[Poppins] text-3xl font-black sm:text-4xl" style={{color: 'var(--wm-navy)'}}>
      {value}{suffix}
    </span>
  );
}

export default function HeroSection() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);
  const [county, setCounty] = useState('Dublin');
  const [serviceQuery, setServiceQuery] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [serviceSuggestions, setServiceSuggestions] = useState<string[]>(fallbackServiceSuggestions);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await fetch('/api/categories', {cache: 'no-store'});
        if (!response.ok) return;
        const payload = (await response.json()) as {
          categories?: Array<{name?: string; parent_id?: string | null}>;
        };
        const names = (payload.categories ?? [])
          .filter((item) => item.parent_id !== null)
          .map((item) => item.name?.trim() ?? '')
          .filter(Boolean);
        if (names.length > 0) {
          setServiceSuggestions(Array.from(new Set(names)).slice(0, 20));
        }
      } catch {
        // Keep fallback suggestions.
      }
    };
    loadSuggestions();
  }, []);

  const filteredSuggestions = serviceSuggestions
    .filter((item) => item.toLowerCase().includes(serviceQuery.trim().toLowerCase()))
    .slice(0, 6);

  const onFindService = () => {
    if (isSearching) return;
    setIsSearching(true);
    const params = new URLSearchParams();
    if (serviceQuery.trim()) params.set('q', serviceQuery.trim());
    if (county) params.set('county', county);
    setSuggestOpen(false);
    router.push(withLocalePrefix(localeRoot, `/search?${params.toString()}`));
  };

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 10% -10%, rgba(0,184,148,0.13), transparent 55%), ' +
            'radial-gradient(ellipse 60% 50% at 90% 10%, rgba(12,27,51,0.07), transparent 50%)'
        }}
      />
      {/* Amber accent bar — top-left decoration */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-1 w-48 rounded-br-full"
        style={{background: 'linear-gradient(to right, var(--wm-amber), transparent)'}}
      />

      <div className="mx-auto max-w-7xl">
        <motion.div variants={heroStaggerContainer} initial="hidden" animate="show" className="relative z-10 space-y-8">

          {/* Badge pill */}
          <motion.div variants={heroItemVariants}>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
              style={{
                borderColor: 'var(--wm-primary-light)',
                backgroundColor: 'var(--wm-primary-light)',
                color: 'var(--wm-primary-dark)'
              }}
            >
              🇮🇪 <span>Ireland&apos;s #1 Trust-First Service Marketplace</span>
              <span
                className="ml-1 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                style={{backgroundColor: 'var(--wm-amber)'}}
              >
                NEW
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={heroItemVariants} className="max-w-3xl">
            <h1
              className="font-[Poppins] font-black leading-[1.1] tracking-tight"
              style={{fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: 'var(--wm-navy)'}}
            >
              Find Verified Pros
              <br />
              <span className="relative inline-block" style={{color: 'var(--wm-primary)'}}>
                Across All of Ireland
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6" preserveAspectRatio="none">
                  <path d="M0 5 Q75 1 150 4 Q225 7 300 3" stroke="var(--wm-amber)" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--wm-muted)]">
              Post a job, get offers from insured professionals, and pay only when the work is done.{' '}
              <strong style={{color: 'var(--wm-text)'}}>No surprises. Just results.</strong>
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            variants={heroItemVariants}
            className="grid gap-3 rounded-2xl border border-[var(--wm-border)] bg-white p-4 md:grid-cols-[1fr_220px_160px]"
            style={{boxShadow: '0 8px 32px rgba(0,184,148,0.10), 0 2px 8px rgba(0,0,0,0.06)'}}
          >
            <div className="relative">
              <label className="flex items-center gap-2 rounded-xl border border-[var(--wm-border)] px-3 py-3 transition-all focus-within:border-[var(--wm-primary)]">
                <Search className="h-4 w-4 flex-shrink-0 text-[var(--wm-muted)]" />
                <input
                  type="text"
                  placeholder="What service do you need? e.g. Plumber"
                  value={serviceQuery}
                  onFocus={() => setSuggestOpen(true)}
                  onBlur={() => window.setTimeout(() => setSuggestOpen(false), 120)}
                  onChange={(event) => {
                    setServiceQuery(event.target.value);
                    setSuggestOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onFindService();
                    }
                  }}
                  className="w-full border-none bg-transparent text-sm outline-none"
                />
                {serviceQuery ? (
                  <button
                    type="button"
                    onClick={() => {setServiceQuery(''); setSuggestOpen(false);}}
                    className="rounded-full p-1 text-[var(--wm-muted)] transition hover:text-[var(--wm-text)]"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </label>
              {suggestOpen && filteredSuggestions.length > 0 ? (
                <div
                  className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[var(--wm-border)] bg-white p-2 shadow-lg"
                >
                  <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--wm-muted)]">
                    Suggested services
                  </p>
                  <div className="grid gap-1">
                    {filteredSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {setServiceQuery(item); setSuggestOpen(false);}}
                        className="rounded-lg px-2 py-2 text-left text-sm text-[var(--wm-text)] transition hover:bg-[var(--wm-primary-light)]"
                      >
                        🔧 {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-[var(--wm-border)] px-3 py-3">
              <MapPin className="h-4 w-4 flex-shrink-0 text-[var(--wm-muted)]" />
              <select
                aria-label="County"
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                className="w-full border-none bg-transparent text-sm outline-none"
              >
                {counties.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
            </label>

            <motion.button
              type="button"
              onClick={onFindService}
              disabled={isSearching}
              whileTap={{scale: 0.98}}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-80"
              style={{background: 'linear-gradient(135deg, var(--wm-primary), var(--wm-primary-dark))'}}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding...
                </>
              ) : (
                <>
                  Find Service
                  <motion.span animate={{x: [0, 2, 0]}} transition={{duration: 1.2, repeat: Infinity, ease: 'easeInOut'}}>
                    🔍
                  </motion.span>
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div variants={heroItemVariants} className="grid gap-3 md:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="group relative overflow-hidden rounded-2xl border border-[var(--wm-border)] bg-white p-5 shadow-sm transition hover:border-[var(--wm-primary)] hover:shadow-md"
              >
                <div className="mb-3 text-3xl">{item.emoji}</div>
                <Counter target={item.value} suffix={item.suffix} />
                <p className="mt-1 text-sm font-medium text-[var(--wm-muted)]">{item.label}</p>
              </div>
            ))}
          </motion.div>

          {/* CTA links */}
          <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-3">
            <a
              href="#how-it-works"
              className="rounded-xl border border-[var(--wm-border)] px-5 py-3 text-sm font-semibold text-[var(--wm-text)] transition hover:border-[var(--wm-primary)] hover:text-[var(--wm-primary)]"
            >
              How it works ↓
            </a>
            <Link
              href={withLocalePrefix(localeRoot, '/search')}
              className="rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.02]"
              style={{background: 'linear-gradient(135deg, var(--wm-primary), var(--wm-primary-dark))'}}
            >
              Explore All Services →
            </Link>
          </motion.div>

          {/* Social proof strip */}
          <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-4 text-sm text-[var(--wm-muted)]">
            <span className="flex items-center gap-1.5">
              <span>⭐⭐⭐⭐⭐</span>
              <strong style={{color: 'var(--wm-text)'}}>4.9/5</strong> from 2,400+ reviews
            </span>
            <span className="hidden h-4 w-px bg-[var(--wm-border)] sm:block" />
            <span>✅ Verified &amp; insured professionals only</span>
            <span className="hidden h-4 w-px bg-[var(--wm-border)] sm:block" />
            <span>🇮🇪 26 counties covered</span>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
