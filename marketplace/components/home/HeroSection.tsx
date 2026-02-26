'use client';

import {motion} from 'framer-motion';
import {MapPin, Search, ShieldCheck, CircleDollarSign, BadgeCheck, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';

import {heroItemVariants, heroStaggerContainer} from '@/styles/animations';

const counties = [
  'Antrim',
  'Armagh',
  'Carlow',
  'Cavan',
  'Clare',
  'Cork',
  'Derry',
  'Donegal',
  'Down',
  'Dublin',
  'Fermanagh',
  'Galway',
  'Kerry',
  'Kildare',
  'Kilkenny',
  'Laois',
  'Leitrim',
  'Limerick',
  'Longford',
  'Louth',
  'Mayo',
  'Meath',
  'Monaghan',
  'Offaly',
  'Roscommon',
  'Sligo',
  'Tipperary',
  'Tyrone',
  'Waterford',
  'Westmeath',
  'Wexford',
  'Wicklow'
];

const stats = [
  {value: 1000, suffix: '+', label: 'Trusted Professionals', icon: BadgeCheck},
  {value: 100, suffix: '%', label: 'Insured Services', icon: ShieldCheck},
  {value: 100, suffix: '%', label: 'Secure Payments', icon: CircleDollarSign}
];

const fallbackServiceSuggestions = [
  'Home Cleaning',
  'Deep Cleaning',
  'Office Cleaning',
  'Painting and Decorating',
  'Plumbing Repair',
  'Electrical Repair',
  'Local Moving',
  'Intercity Moving',
  'AC Service',
  'Handyman Service'
];

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
      if (next >= target) {
        window.clearInterval(timer);
      }
    }, interval);

    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <span className="font-[Poppins] text-3xl font-bold text-[#1F2937] sm:text-4xl">
      {value}
      {suffix}
    </span>
  );
}

export default function HeroSection() {
  const router = useRouter();
  const [county, setCounty] = useState('Dublin');
  const [serviceQuery, setServiceQuery] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
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
        // Keep fallback suggestions when categories endpoint is unavailable.
      }
    };
    loadSuggestions();
  }, []);

  const filteredSuggestions = serviceSuggestions
    .filter((item) => item.toLowerCase().includes(serviceQuery.trim().toLowerCase()))
    .slice(0, 6);

  const onFindService = () => {
    const params = new URLSearchParams();
    if (serviceQuery.trim()) params.set('q', serviceQuery.trim());
    if (county) params.set('county', county);
    setSuggestOpen(false);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F9FAFB] via-white to-white px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-10 [background:radial-gradient(circle_at_15%_25%,#00B894,transparent_35%),radial-gradient(circle_at_85%_20%,#0066CC,transparent_30%)]" />
      <div className="mx-auto max-w-7xl">
        <motion.div variants={heroStaggerContainer} initial="hidden" animate="show" className="relative z-10 space-y-8">
          <motion.div variants={heroItemVariants} className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-1 text-sm font-medium text-[#047857]">
              WorkMate - Trust-first local marketplace
            </p>
            <h1 className="font-[Poppins] text-4xl font-bold leading-tight text-[#1F2937] sm:text-5xl">
              Ireland&apos;s Trusted Marketplace for Home Services
            </h1>
            <p className="mt-4 text-lg text-[#4B5563]">
              Verified, insured professionals across all counties. Post once, receive qualified offers quickly.
            </p>
          </motion.div>

          <motion.div
            variants={heroItemVariants}
            className="grid gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-lg md:grid-cols-[1fr_220px_160px]"
          >
            <div className="relative">
              <label className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-3">
                <Search className="h-4 w-4 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="What service do you need?"
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
                    onClick={() => {
                      setServiceQuery('');
                      setSuggestOpen(false);
                    }}
                    className="rounded-full p-1 text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#1F2937]"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </label>
              {suggestOpen && filteredSuggestions.length > 0 ? (
                <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[#D7E2EB] bg-white p-2 shadow-lg">
                  <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Suggested services
                  </p>
                  <div className="grid gap-1">
                    {filteredSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setServiceQuery(item);
                          setSuggestOpen(false);
                        }}
                        className="rounded-lg px-2 py-2 text-left text-sm text-[#1F2937] transition hover:bg-[#ECFDF5]"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-3">
              <MapPin className="h-4 w-4 text-[#6B7280]" />
              <select
                aria-label="County"
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                className="w-full border-none bg-transparent text-sm outline-none"
              >
                {counties.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={onFindService}
              className="rounded-xl bg-[#00B894] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-[#008B74]"
            >
              Find Service
            </button>
          </motion.div>

          <motion.div variants={heroItemVariants} className="grid gap-3 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#0066CC]">
                  <item.icon className="h-5 w-5" />
                </div>
                <Counter target={item.value} suffix={item.suffix} />
                <p className="mt-2 text-sm text-[#4B5563]">{item.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-3">
            <a
              href="#how-it-works"
              className="rounded-xl border border-[#D1D5DB] px-5 py-3 text-sm font-semibold text-[#1F2937] transition hover:border-[#00B894]"
            >
              How it works
            </a>
            <a
              href="/search"
              className="rounded-xl bg-[#00B894] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#008B74]"
            >
              Explore Services
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
