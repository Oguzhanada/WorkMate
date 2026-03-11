'use client';

import Link from 'next/link';
import { Search, MapPin, ArrowRight, Shield, CheckCircle, CreditCard } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import { motion } from 'framer-motion';

const counties = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
];

const SERVICE_SUGGESTIONS = [
  'Plumber', 'Electrician', 'House cleaning', 'Deep clean', 'End of tenancy cleaning',
  'Gardening', 'Garden clearance', 'Painter', 'Painting & decorating',
  'Moving home', 'House removals', 'Handyman', 'Boiler service', 'Boiler repair',
  'Tiling', 'Plastering', 'Flooring', 'Roof repair', 'Carpentry',
  'Window cleaning', 'Pressure washing', 'Security system', 'CCTV installation',
  'Photography', 'Catering', 'Tutoring', 'Maths grinds',
];

const POPULAR_SEARCHES = ['Plumber', 'House cleaning', 'Electrician', 'Gardening', 'Moving home'];

export default function HeroSection() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const [serviceQuery, setServiceQuery] = useState('');
  const [county, setCounty] = useState('Dublin');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const onSearch = (query?: string) => {
    const q = (query ?? serviceQuery).trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (county) params.set('county', county);
    setShowSuggestions(false);
    router.push(withLocalePrefix(localeRoot, `/find-services?${params.toString()}`));
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setServiceQuery(val);
    setActiveSuggestion(-1);
    if (val.trim().length >= 3) {
      const filtered = SERVICE_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(val.toLowerCase().trim()),
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        setServiceQuery(suggestions[activeSuggestion]);
        onSearch(suggestions[activeSuggestion]);
      } else {
        onSearch();
      }
      return;
    }
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((p) => Math.max(p - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !suggestionsRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: '88vh',
        background: 'linear-gradient(160deg, var(--wm-navy) 0%, #0c1a2e 55%, #0a2522 100%)',
      }}
    >
      {/* Subtle ambient glow — top right */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: '700px',
          height: '700px',
          top: '-15%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(var(--wm-primary-rgb), 0.09) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      {/* Top accent line */}
      <div
        className="absolute left-0 right-0 top-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, var(--wm-primary) 50%, transparent 90%)',
          opacity: 0.5,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-5 pb-20 pt-28 sm:px-8 lg:px-12">

        {/* Platform badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{
              background: 'rgba(var(--wm-primary-rgb), 0.1)',
              border: '1px solid rgba(var(--wm-primary-rgb), 0.22)',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--wm-primary)', boxShadow: '0 0 6px var(--wm-primary)' }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--wm-primary-dark)' }}
            >
              Ireland&apos;s Home Services Platform
            </span>
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: 'var(--wm-font-display)',
            fontWeight: 800,
            fontSize: 'clamp(2.6rem, 7vw, 5.5rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.035em',
            marginTop: '1.75rem',
          }}
        >
          <span style={{ color: 'white' }}>Trusted tradespeople,</span>
          <br />
          <span
            style={{
              background: 'linear-gradient(120deg, var(--wm-primary) 0%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            anywhere in Ireland.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.4 }}
          className="mt-5 max-w-lg"
          style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.65,
          }}
        >
          Verified tradespeople across all 26 counties. Post a job free, get quotes within hours,
          and pay securely through Stripe — only when the work is done.
        </motion.p>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.55 }}
          className="mt-8 max-w-2xl"
        >
          <div
            className="flex flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Search input with autocomplete */}
            <div className="relative flex-1">
              <label
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--wm-primary)' }} />
                <input
                  ref={inputRef}
                  value={serviceQuery}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="What do you need done?"
                  className="w-full border-none bg-transparent text-sm font-medium outline-none placeholder:text-white/30"
                  style={{ color: 'white', fontFamily: 'var(--wm-font-sans)' }}
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={showSuggestions}
                  aria-haspopup="listbox"
                />
              </label>

              {/* Autocomplete dropdown */}
              {showSuggestions && (
                <div
                  ref={suggestionsRef}
                  role="listbox"
                  className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl"
                  style={{
                    background: 'white',
                    border: '1px solid var(--wm-border)',
                    boxShadow: 'var(--wm-shadow-xl)',
                  }}
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={s}
                      role="option"
                      aria-selected={i === activeSuggestion}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setServiceQuery(s);
                        onSearch(s);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                      style={{
                        color: 'var(--wm-navy)',
                        background: i === activeSuggestion ? 'var(--wm-primary-light)' : 'transparent',
                        fontFamily: 'var(--wm-font-sans)',
                        fontWeight: 500,
                      }}
                    >
                      <Search
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: 'var(--wm-primary)', opacity: 0.7 }}
                      />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* County selector */}
            <label
              className="flex items-center gap-3 rounded-xl px-4 py-3 sm:w-44"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <MapPin className="h-4 w-4 shrink-0" style={{ color: 'var(--wm-primary)' }} />
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full border-none bg-transparent text-sm font-medium outline-none"
                style={{ color: 'white', fontFamily: 'var(--wm-font-sans)' }}
                aria-label="Select county"
              >
                {counties.map((c) => (
                  <option key={c} value={c} style={{ color: 'var(--wm-navy)' }}>{c}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => onSearch()}
              className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
              style={{
                background: 'var(--wm-grad-primary)',
                boxShadow: '0 6px 24px rgba(var(--wm-primary-rgb), 0.32)',
              }}
            >
              Search
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Popular category quick chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.75 }}
            className="mt-3 flex flex-wrap items-center gap-2"
          >
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Popular:</span>
            {POPULAR_SEARCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setServiceQuery(s);
                  onSearch(s);
                }}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors hover:border-white/30"
                style={{
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.6)',
                  background: 'rgba(255,255,255,0.05)',
                  fontFamily: 'var(--wm-font-sans)',
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mt-6 flex flex-wrap items-center gap-5"
        >
          {[
            { icon: CheckCircle, text: 'Verified Irish Pros' },
            { icon: CreditCard, text: 'Secure Stripe Payments' },
            { icon: Shield, text: 'Free to Post' },
          ].map(({ icon: Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: 'var(--wm-primary)', opacity: 0.75 }} />
              {text}
            </span>
          ))}
        </motion.div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.75 }}
          className="mt-6 flex flex-wrap items-center gap-4"
        >
          <Link
            href={withLocalePrefix(localeRoot, '/post-job')}
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition-transform hover:scale-[1.02] active:scale-95"
            style={{
              background: 'white',
              color: 'var(--wm-navy)',
              fontFamily: 'var(--wm-font-display)',
              boxShadow: '0 6px 24px rgba(255,255,255,0.1)',
            }}
          >
            Post a Job — Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={withLocalePrefix(localeRoot, '/become-provider')}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
            style={{
              color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.15)',
              fontFamily: 'var(--wm-font-display)',
            }}
          >
            Become a Pro
          </Link>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-28"
        style={{ background: 'linear-gradient(to top, var(--wm-bg), transparent)' }}
      />
    </section>
  );
}
