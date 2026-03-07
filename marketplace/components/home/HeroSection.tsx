'use client';

import {motion} from 'framer-motion';
import Link from 'next/link';
import {MapPin, Search, X, Loader2, ArrowRight} from 'lucide-react';
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
  {value: 1000, suffix: '+', label: 'Trusted Pros'},
  {value: 100, suffix: '%', label: 'Insured'},
  {value: 100, suffix: '%', label: 'Secure Pay'}
];

const floatingChips = [
  {label: 'Plumber', delay: 0},
  {label: 'Electrician', delay: 0.3},
  {label: 'Painter', delay: 0.6},
  {label: 'Gardener', delay: 0.9},
];

const fallbackServiceSuggestions = getTaxonomySuggestions();

function Counter({target, suffix = ''}: {target: number; suffix?: string}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 1200;
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
    <span
      className="block text-2xl font-black leading-none tracking-tight"
      style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)'}}
    >
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
    <section className="relative overflow-hidden px-4 pb-24 pt-14 sm:px-6 lg:px-8">
      {/* Rich layered background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at -5% -10%, rgba(0,184,148,0.13) 0%, transparent 52%), ' +
            'radial-gradient(ellipse 70% 60% at 105% -5%, rgba(12,27,51,0.08) 0%, transparent 50%), ' +
            'radial-gradient(ellipse 50% 40% at 50% 110%, rgba(0,184,148,0.06) 0%, transparent 60%)'
        }}
      />

      {/* Amber top-left accent line */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-0.5 w-64 rounded-br-full opacity-80"
        style={{background: 'linear-gradient(to right, var(--wm-amber), transparent)'}}
      />
      {/* Right-side teal vertical stripe */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 top-0 hidden w-0.5 opacity-20 lg:block"
        style={{background: 'linear-gradient(to bottom, transparent, var(--wm-primary), transparent)'}}
      />

      {/* Floating service chips — decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {floatingChips.map((chip, i) => (
          <motion.div
            key={chip.label}
            className="absolute rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: 'rgba(0,184,148,0.20)',
              backgroundColor: 'rgba(0,184,148,0.06)',
              color: 'var(--wm-primary-dark)',
              top: `${20 + i * 18}%`,
              right: `${6 + (i % 2) * 8}%`,
            }}
            initial={{opacity: 0, x: 20}}
            animate={{opacity: [0, 0.7, 0.7, 0], x: [20, 0, 0, -10], y: [0, 0, -8, -16]}}
            transition={{duration: 5, delay: chip.delay + 1.5, repeat: Infinity, repeatDelay: 3}}
          >
            {chip.label}
          </motion.div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={heroStaggerContainer}
          initial="hidden"
          animate="show"
          className="relative z-10 space-y-8"
        >
          {/* Badge pill */}
          <motion.div variants={heroItemVariants}>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
              style={{
                borderColor: 'rgba(0,184,148,0.25)',
                backgroundColor: 'var(--wm-primary-faint)',
                color: 'var(--wm-primary-dark)',
                fontFamily: 'var(--wm-font-display)'
              }}
            >
              <span className="text-sm">🇮🇪</span>
              <span>Ireland&apos;s Trust-First Service Marketplace</span>
              <span
                className="ml-0.5 rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                style={{backgroundColor: 'var(--wm-amber)'}}
              >
                NEW
              </span>
            </span>
          </motion.div>

          {/* Headline — Syne display */}
          <motion.div variants={heroItemVariants} className="max-w-3xl">
            <h1
              style={{
                fontFamily: 'var(--wm-font-display)',
                fontWeight: 800,
                fontSize: 'clamp(2.4rem, 5.5vw, 3.75rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                color: 'var(--wm-navy)'
              }}
            >
              Find Verified Pros
              <br />
              <span
                className="relative inline-block"
                style={{color: 'var(--wm-primary)'}}
              >
                Across All of Ireland
                {/* Animated underline */}
                <motion.svg
                  className="absolute -bottom-1 left-0 w-full"
                  height="6"
                  viewBox="0 0 300 6"
                  preserveAspectRatio="none"
                  initial={{pathLength: 0, opacity: 0}}
                  animate={{pathLength: 1, opacity: 1}}
                  transition={{duration: 0.8, delay: 0.6, ease: 'easeOut'}}
                >
                  <motion.path
                    d="M0 5 Q75 1 150 4 Q225 7 300 3"
                    stroke="var(--wm-amber)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </span>
            </h1>
            <p
              className="mt-5 max-w-xl text-lg leading-relaxed"
              style={{color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-sans)'}}
            >
              Post a job, get offers from insured professionals, and pay only when the work is done.{' '}
              <strong style={{color: 'var(--wm-text)', fontWeight: 600}}>No surprises. Just results.</strong>
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            variants={heroItemVariants}
            className="grid gap-3 rounded-2xl border bg-white p-3.5 md:grid-cols-[1fr_200px_148px]"
            style={{
              borderColor: 'var(--wm-border)',
              boxShadow: '0 8px 40px rgba(0,184,148,0.10), 0 2px 10px rgba(0,0,0,0.06)'
            }}
          >
            {/* Service input */}
            <div className="relative">
              <label
                className="flex items-center gap-2.5 rounded-xl border px-3.5 py-3 transition-all"
                style={{borderColor: 'var(--wm-border)'}}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--wm-primary)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--wm-border)')}
              >
                <Search className="h-4 w-4 flex-shrink-0" style={{color: 'var(--wm-muted)'}} />
                <input
                  type="text"
                  placeholder="What service do you need?"
                  value={serviceQuery}
                  onFocus={() => setSuggestOpen(true)}
                  onBlur={() => window.setTimeout(() => setSuggestOpen(false), 120)}
                  onChange={(e) => { setServiceQuery(e.target.value); setSuggestOpen(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onFindService(); } }}
                  className="w-full border-none bg-transparent text-sm outline-none"
                  style={{color: 'var(--wm-text)'}}
                />
                {serviceQuery ? (
                  <button
                    type="button"
                    onClick={() => { setServiceQuery(''); setSuggestOpen(false); }}
                    className="rounded-full p-0.5 transition"
                    style={{color: 'var(--wm-muted)'}}
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>

              {suggestOpen && filteredSuggestions.length > 0 ? (
                <div
                  className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border bg-white p-2"
                  style={{borderColor: 'var(--wm-border)', boxShadow: 'var(--wm-shadow-xl)'}}
                >
                  <p
                    className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{color: 'var(--wm-subtle)', fontFamily: 'var(--wm-font-display)'}}
                  >
                    Suggested services
                  </p>
                  {filteredSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => { setServiceQuery(item); setSuggestOpen(false); }}
                      className="w-full rounded-lg px-2.5 py-2 text-left text-sm transition"
                      style={{color: 'var(--wm-text)'}}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--wm-primary-light)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* County select */}
            <label
              className="flex items-center gap-2.5 rounded-xl border px-3.5 py-3"
              style={{borderColor: 'var(--wm-border)'}}
            >
              <MapPin className="h-4 w-4 flex-shrink-0" style={{color: 'var(--wm-muted)'}} />
              <select
                aria-label="County"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full border-none bg-transparent text-sm outline-none"
                style={{color: 'var(--wm-text)'}}
              >
                {counties.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
            </label>

            {/* CTA button */}
            <motion.button
              type="button"
              onClick={onFindService}
              disabled={isSearching}
              whileTap={{scale: 0.97}}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, var(--wm-primary) 0%, var(--wm-primary-dark) 100%)',
                fontFamily: 'var(--wm-font-display)',
                boxShadow: '0 4px 16px rgba(0,184,148,0.35)',
                transition: 'box-shadow var(--wm-transition), transform var(--wm-transition)'
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 22px rgba(0,184,148,0.50)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,184,148,0.35)'; }}
            >
              {isSearching ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Finding...</>
              ) : (
                <>Find Service <ArrowRight className="h-4 w-4" /></>
              )}
            </motion.button>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-6">
            {stats.map((item, i) => (
              <div key={item.label} className="flex items-baseline gap-1.5">
                <Counter target={item.value} suffix={item.suffix} />
                <span className="text-sm" style={{color: 'var(--wm-muted)'}}>{item.label}</span>
                {i < stats.length - 1 ? (
                  <span className="ml-4 hidden h-4 w-px sm:block" style={{backgroundColor: 'var(--wm-border)'}} />
                ) : null}
              </div>
            ))}
          </motion.div>

          {/* CTA links */}
          <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-3">
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition"
              style={{
                borderColor: 'var(--wm-border)',
                color: 'var(--wm-text)',
                fontFamily: 'var(--wm-font-display)'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--wm-primary)';
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--wm-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--wm-border)';
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--wm-text)';
              }}
            >
              How it works
              <motion.span animate={{y: [0, 2, 0]}} transition={{duration: 1.5, repeat: Infinity}}>↓</motion.span>
            </a>
            <Link
              href={withLocalePrefix(localeRoot, '/search')}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, var(--wm-navy) 0%, var(--wm-navy-mid) 100%)',
                fontFamily: 'var(--wm-font-display)',
                boxShadow: '0 4px 14px rgba(12,27,51,0.25)'
              }}
            >
              Explore Services <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            variants={heroItemVariants}
            className="flex flex-wrap items-center gap-5 text-sm"
            style={{color: 'var(--wm-muted)'}}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-[var(--wm-amber)]">★★★★★</span>
              <strong style={{color: 'var(--wm-text)', fontWeight: 600}}>4.9/5</strong>
              <span>from 2,400+ reviews</span>
            </span>
            <span className="hidden h-3.5 w-px sm:block" style={{backgroundColor: 'var(--wm-border)'}} />
            <span>Verified &amp; insured professionals only</span>
            <span className="hidden h-3.5 w-px sm:block" style={{backgroundColor: 'var(--wm-border)'}} />
            <span>26 counties covered</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
