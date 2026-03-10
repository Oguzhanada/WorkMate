'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useMemo, useState} from 'react';
import {motion} from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Calculator,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  Shield,
  Star,
  TrendingUp,
  Zap,
  Crown,
} from 'lucide-react';

import FoundingProBadge from '@/components/ui/FoundingProBadge';

import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';

/* ─── Earnings Calculator Logic ─── */

function calcEarnings(jobsPerWeek: number, avgJobValue: number) {
  const weeklyGross = jobsPerWeek * avgJobValue;
  const monthlyGross = weeklyGross * 4.3;
  const yearlyGross = monthlyGross * 12;

  // Commission: 0% under €100, 3% Starter, 1.5% Pro
  const commissionRate = avgJobValue < 100 ? 0 : 0.03;
  const proCommissionRate = avgJobValue < 100 ? 0 : 0.015;

  const monthlyNet = monthlyGross * (1 - commissionRate);
  const monthlyNetPro = monthlyGross * (1 - proCommissionRate) - 19;
  const yearlyNet = yearlyGross * (1 - commissionRate);
  const yearlyNetPro = yearlyGross * (1 - proCommissionRate) - 228;

  return {monthlyGross, monthlyNet, monthlyNetPro, yearlyNet, yearlyNetPro};
}

/* ─── Data ─── */

const BENEFITS = [
  {
    icon: CreditCard,
    title: 'Secure payment, every time',
    desc: 'Stripe holds funds before work begins. No chasing invoices. No bad debts.',
    accent: 'var(--wm-primary)',
    bg: 'var(--wm-primary-faint)',
  },
  {
    icon: MapPin,
    title: 'Jobs in your area',
    desc: 'County-first matching across all 26 Irish counties. Work close to home or go nationwide.',
    accent: 'var(--wm-blue)',
    bg: 'var(--wm-blue-soft)',
  },
  {
    icon: Star,
    title: 'Build your reputation',
    desc: 'Verified reviews, portfolio gallery, and compliance badges that customers trust.',
    accent: 'var(--wm-amber-dark)',
    bg: 'var(--wm-amber-light)',
  },
  {
    icon: Shield,
    title: 'Irish compliance built in',
    desc: 'SafePass, Public Liability, Tax Clearance, Garda Vetting — all managed in one place.',
    accent: 'var(--wm-primary)',
    bg: 'var(--wm-primary-faint)',
  },
  {
    icon: BarChart3,
    title: 'Analytics dashboard',
    desc: 'Track earnings, job conversion rates, and customer satisfaction in real time.',
    accent: 'var(--wm-blue)',
    bg: 'var(--wm-blue-soft)',
  },
  {
    icon: MessageSquare,
    title: 'Direct messaging',
    desc: 'Chat with customers before, during, and after jobs. No middlemen, no phone tag.',
    accent: 'var(--wm-amber-dark)',
    bg: 'var(--wm-amber-light)',
  },
];

const HOW_STEPS = [
  {num: '1', title: 'Create your profile', desc: 'Sign up free. Add your services, areas, and availability in under 5 minutes.'},
  {num: '2', title: 'Get verified', desc: 'Upload ID and insurance. Our team reviews within 24 hours — no auto-approvals.'},
  {num: '3', title: 'Receive job matches', desc: 'Get notified when customers post jobs in your area and category.'},
  {num: '4', title: 'Quote and earn', desc: 'Send competitive quotes. Win the job. Get paid securely via Stripe.'},
];

const COMPARISON = [
  {platform: 'WorkMate', model: '3% per job (1.5% Pro)', leads: 'Free matching', upfront: '€0', highlight: true},
  {platform: 'Bark', model: '€2-€15 per lead', leads: 'Pay to contact', upfront: '€0', highlight: false},
  {platform: 'TaskRabbit', model: '15% per job', leads: 'Free matching', upfront: '€0', highlight: false},
  {platform: 'MyBuilder', model: '8-12% + sub', leads: 'Pay to quote', upfront: '€20+/mo', highlight: false},
  {platform: 'Rated People', model: '£5-£30 per lead', leads: 'Pay per lead', upfront: '£0', highlight: false},
];

const TESTIMONIALS = [
  {
    name: 'Darren K.',
    role: 'Electrician, Dublin',
    text: 'I was paying €15 per lead on Bark with no guarantee. WorkMate sends me matched jobs and I only pay 3% when I actually earn. Massive difference.',
    rating: 5,
  },
  {
    name: 'Sinéad M.',
    role: 'Cleaner, Cork',
    text: 'The secure payment hold changed everything. I used to lose 2-3 jobs a month to non-payers. Now I start every job knowing the money is already there.',
    rating: 5,
  },
  {
    name: 'Pádraig O.',
    role: 'Plumber, Galway',
    text: 'Upgraded to Pro after the first month. The lower commission plus priority listing pays for itself within 2 jobs. Best investment in my business.',
    rating: 5,
  },
];

/* ─── Page Component ─── */

export default function BecomeProviderPage() {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const [jobsPerWeek, setJobsPerWeek] = useState(4);
  const [avgJobValue, setAvgJobValue] = useState(200);

  const earnings = useMemo(() => calcEarnings(jobsPerWeek, avgJobValue), [jobsPerWeek, avgJobValue]);

  return (
    <div className="min-h-screen" style={{background: 'var(--wm-bg)'}}>
      {/* ─── HERO ─── */}
      <section
        className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 lg:px-12"
        style={{
          background: 'linear-gradient(155deg, var(--wm-navy) 0%, #0c1a2e 40%, #0a2a29 100%)',
          minHeight: '85vh',
        }}
      >
        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        {/* Glow orbs */}
        <div
          className="pointer-events-none absolute -left-32 top-1/4"
          style={{
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(var(--wm-primary-rgb), 0.12) 0%, transparent 60%)',
            filter: 'blur(100px)',
          }}
        />
        <div
          className="pointer-events-none absolute -right-32 bottom-0"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: Copy */}
            <motion.div
              initial={{opacity: 0, y: 30}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.6}}
            >
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                style={{
                  background: 'rgba(var(--wm-primary-rgb), 0.15)',
                  border: '1px solid rgba(var(--wm-primary-rgb), 0.25)',
                }}
              >
                <Zap className="h-3.5 w-3.5" style={{color: 'var(--wm-primary)'}} />
                <span className="text-xs font-bold" style={{color: 'var(--wm-primary)'}}>
                  Now accepting providers across Ireland
                </span>
              </div>

              <h1
                style={{
                  fontFamily: 'var(--wm-font-display)',
                  fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                }}
              >
                <span style={{color: 'white'}}>Grow your trade.</span>
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, var(--wm-primary) 0%, #34d399 50%, var(--wm-amber) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Not your overheads.
                </span>
              </h1>

              <p
                className="mt-6 max-w-lg text-lg leading-relaxed"
                style={{color: 'rgba(255,255,255,0.65)'}}
              >
                WorkMate connects you with verified customers in your area.
                No upfront fees. No lead costs. You only pay a small commission when you actually earn.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={withLocalePrefix(localeRoot, '/become-provider/apply')}
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold transition-transform hover:scale-[1.03] active:scale-95"
                  style={{
                    background: 'var(--wm-grad-primary)',
                    color: 'white',
                    fontFamily: 'var(--wm-font-display)',
                    boxShadow: '0 8px 32px rgba(var(--wm-primary-rgb), 0.3)',
                  }}
                >
                  Apply Now — It&apos;s Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={withLocalePrefix(localeRoot, '/pricing')}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold transition-colors"
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  View Pricing
                </Link>
              </div>

              {/* Trust signals */}
              <div className="mt-10 flex flex-wrap items-center gap-6">
                {[
                  {icon: BadgeCheck, label: 'Admin-verified'},
                  {icon: Shield, label: 'Stripe secure hold'},
                  {icon: Clock, label: '<24h approval'},
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" style={{color: 'var(--wm-primary)'}} />
                    <span className="text-xs font-medium" style={{color: 'rgba(255,255,255,0.5)'}}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Stats card */}
            <motion.div
              initial={{opacity: 0, y: 30}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.6, delay: 0.2}}
              className="rounded-3xl p-8"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <h3
                className="mb-6 text-sm font-bold uppercase tracking-[0.15em]"
                style={{color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)'}}
              >
                Why providers choose WorkMate
              </h3>
              <div className="grid grid-cols-2 gap-5">
                {[
                  {value: '€0', label: 'To get started', sub: 'No signup fees ever'},
                  {value: '3%', label: 'Commission', sub: '1.5% with Pro plan'},
                  {value: '<24h', label: 'Approval time', sub: 'Manual review by our team'},
                  {value: '26', label: 'Counties covered', sub: 'All of Ireland'},
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{opacity: 0, y: 15}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.4 + i * 0.1}}
                    className="rounded-2xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span
                      className="text-2xl font-extrabold"
                      style={{
                        fontFamily: 'var(--wm-font-display)',
                        color: 'var(--wm-primary)',
                      }}
                    >
                      {stat.value}
                    </span>
                    <p className="mt-1 text-sm font-semibold" style={{color: 'white'}}>
                      {stat.label}
                    </p>
                    <p className="text-xs" style={{color: 'rgba(255,255,255,0.4)'}}>
                      {stat.sub}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
          style={{background: 'linear-gradient(to top, var(--wm-bg), transparent)'}}
        />
      </section>

      {/* ─── BENEFITS GRID ─── */}
      <section className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="mb-14 max-w-2xl"
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, amount: 0.3}}
            transition={{duration: 0.5}}
          >
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)'}}
            >
              Built for Irish tradespeople
            </span>
            <h2
              className="mt-3"
              style={{
                fontFamily: 'var(--wm-font-display)',
                fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--wm-navy)',
              }}
            >
              Everything you need to grow your business.
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <motion.article
                key={b.title}
                initial={{opacity: 0, y: 24}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, amount: 0.2}}
                transition={{duration: 0.4, delay: i * 0.06}}
                className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
                style={{
                  background: 'var(--wm-surface)',
                  border: '1px solid var(--wm-border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = b.accent;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--wm-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[2px]"
                  style={{background: b.accent, opacity: 0.4}}
                />
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{background: b.bg, color: b.accent}}
                >
                  <b.icon className="h-5 w-5" />
                </div>
                <h3
                  className="text-base font-bold"
                  style={{
                    fontFamily: 'var(--wm-font-display)',
                    color: 'var(--wm-navy)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{color: 'var(--wm-muted)'}}>
                  {b.desc}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EARNINGS CALCULATOR ─── */}
      <section
        className="px-5 py-24 sm:px-8 lg:px-12"
        style={{background: 'linear-gradient(180deg, rgba(240,253,244,0.3) 0%, var(--wm-bg) 100%)'}}
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-12 text-center"
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5}}
          >
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)'}}
            >
              Earnings calculator
            </span>
            <h2
              className="mt-3"
              style={{
                fontFamily: 'var(--wm-font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--wm-navy)',
              }}
            >
              See what you could earn on WorkMate.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base" style={{color: 'var(--wm-muted)'}}>
              Adjust the sliders to match your workload. All figures after WorkMate commission.
            </p>
          </motion.div>

          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5, delay: 0.1}}
            className="grid gap-8 lg:grid-cols-2"
          >
            {/* Sliders */}
            <div
              className="rounded-2xl p-6"
              style={{background: 'var(--wm-surface)', border: '1px solid var(--wm-border)'}}
            >
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{color: 'var(--wm-navy)'}}>
                    Jobs per week
                  </label>
                  <span
                    className="text-lg font-extrabold"
                    style={{color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)'}}
                  >
                    {jobsPerWeek}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={jobsPerWeek}
                  onChange={(e) => setJobsPerWeek(Number(e.target.value))}
                  className="w-full accent-[var(--wm-primary)]"
                />
                <div className="mt-1 flex justify-between text-xs" style={{color: 'var(--wm-muted)'}}>
                  <span>1</span>
                  <span>15</span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{color: 'var(--wm-navy)'}}>
                    Average job value
                  </label>
                  <span
                    className="text-lg font-extrabold"
                    style={{color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)'}}
                  >
                    €{avgJobValue}
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={2000}
                  step={50}
                  value={avgJobValue}
                  onChange={(e) => setAvgJobValue(Number(e.target.value))}
                  className="w-full accent-[var(--wm-primary)]"
                />
                <div className="mt-1 flex justify-between text-xs" style={{color: 'var(--wm-muted)'}}>
                  <span>€50</span>
                  <span>€2,000</span>
                </div>
              </div>

              {avgJobValue < 100 && (
                <div
                  className="mt-6 rounded-xl p-3"
                  style={{background: 'var(--wm-primary-faint)', border: '1px solid rgba(var(--wm-primary-rgb), 0.15)'}}
                >
                  <p className="text-xs font-bold" style={{color: 'var(--wm-primary-dark)'}}>
                    Jobs under €100 = 0% commission
                  </p>
                  <p className="mt-0.5 text-xs" style={{color: 'var(--wm-muted)'}}>
                    You keep 100% of the job value. Payment arranged directly with the customer.
                  </p>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'linear-gradient(155deg, var(--wm-navy) 0%, #0c1a2e 100%)',
                }}
              >
                <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{color: 'var(--wm-primary)'}}>
                  Monthly earnings (Starter)
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    className="text-4xl font-extrabold text-white"
                    style={{fontFamily: 'var(--wm-font-display)'}}
                  >
                    €{Math.round(earnings.monthlyNet).toLocaleString()}
                  </span>
                  <span className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>
                    /month after 3% commission
                  </span>
                </div>
              </div>

              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'var(--wm-surface)',
                  border: '2px solid var(--wm-primary)',
                  boxShadow: 'var(--wm-glow-primary)',
                }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{color: 'var(--wm-primary)'}} />
                  <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{color: 'var(--wm-primary)'}}>
                    Monthly earnings (Pro — €19/mo)
                  </p>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    className="text-4xl font-extrabold"
                    style={{color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)'}}
                  >
                    €{Math.round(earnings.monthlyNetPro).toLocaleString()}
                  </span>
                  <span className="text-sm" style={{color: 'var(--wm-muted)'}}>
                    /month after 1.5% commission
                  </span>
                </div>
                <p className="mt-2 text-xs" style={{color: 'var(--wm-primary)'}}>
                  Save €{Math.round(earnings.monthlyNetPro - earnings.monthlyNet + 19).toLocaleString()}/month
                  vs Starter plan
                </p>
              </div>

              <div
                className="rounded-xl p-4"
                style={{background: 'var(--wm-primary-faint)'}}
              >
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" style={{color: 'var(--wm-primary-dark)'}} />
                  <p className="text-xs font-bold" style={{color: 'var(--wm-primary-dark)'}}>
                    Yearly projection: €{Math.round(earnings.yearlyNetPro).toLocaleString()} (Pro)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ─── */}
      <section className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="mb-12 text-center"
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5}}
          >
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)'}}
            >
              How we compare
            </span>
            <h2
              className="mt-3"
              style={{
                fontFamily: 'var(--wm-font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--wm-navy)',
              }}
            >
              Stop paying for leads you never convert.
            </h2>
          </motion.div>

          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5, delay: 0.1}}
            className="overflow-hidden rounded-2xl"
            style={{border: '1px solid var(--wm-border)'}}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr style={{background: 'var(--wm-surface)'}}>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.1em]" style={{color: 'var(--wm-muted)'}}>Platform</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.1em]" style={{color: 'var(--wm-muted)'}}>Commission</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.1em]" style={{color: 'var(--wm-muted)'}}>Lead cost</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.1em]" style={{color: 'var(--wm-muted)'}}>Upfront</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr
                      key={row.platform}
                      style={{
                        background: row.highlight ? 'var(--wm-primary-faint)' : 'var(--wm-bg)',
                        borderTop: '1px solid var(--wm-border)',
                      }}
                    >
                      <td className="px-5 py-4">
                        <span
                          className="text-sm font-bold"
                          style={{
                            color: row.highlight ? 'var(--wm-primary-dark)' : 'var(--wm-navy)',
                            fontFamily: row.highlight ? 'var(--wm-font-display)' : undefined,
                          }}
                        >
                          {row.platform}
                          {row.highlight && (
                            <BadgeCheck
                              className="ml-1.5 inline-block h-4 w-4"
                              style={{color: 'var(--wm-primary)'}}
                            />
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{color: row.highlight ? 'var(--wm-primary-dark)' : 'var(--wm-text)', fontWeight: row.highlight ? 700 : 400}}>
                        {row.model}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{color: row.highlight ? 'var(--wm-primary-dark)' : 'var(--wm-text)', fontWeight: row.highlight ? 700 : 400}}>
                        {row.leads}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{color: row.highlight ? 'var(--wm-primary-dark)' : 'var(--wm-text)', fontWeight: row.highlight ? 700 : 400}}>
                        {row.upfront}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <p className="mt-4 text-center text-xs" style={{color: 'var(--wm-muted)'}}>
            Competitor data sourced from public pricing pages as of March 2026.
          </p>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        className="px-5 py-24 sm:px-8 lg:px-12"
        style={{background: 'linear-gradient(180deg, rgba(240,253,244,0.2) 0%, var(--wm-bg) 100%)'}}
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-12 text-center"
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5}}
          >
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)'}}
            >
              Getting started
            </span>
            <h2
              className="mt-3"
              style={{
                fontFamily: 'var(--wm-font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--wm-navy)',
              }}
            >
              From signup to first job in 4 steps.
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{opacity: 0, y: 24}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.4, delay: i * 0.08}}
                className="rounded-2xl p-5"
                style={{background: 'var(--wm-surface)', border: '1px solid var(--wm-border)'}}
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-black"
                  style={{
                    background: 'var(--wm-primary-faint)',
                    color: 'var(--wm-primary)',
                    fontFamily: 'var(--wm-font-display)',
                  }}
                >
                  {s.num}
                </div>
                <h4 className="text-sm font-bold" style={{color: 'var(--wm-navy)'}}>{s.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed" style={{color: 'var(--wm-muted)'}}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-12 text-center"
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5}}
          >
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)'}}
            >
              Provider stories
            </span>
            <h2
              className="mt-3"
              style={{
                fontFamily: 'var(--wm-font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--wm-navy)',
              }}
            >
              Hear from providers across Ireland.
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.blockquote
                key={t.name}
                initial={{opacity: 0, y: 24}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.4, delay: i * 0.08}}
                className="rounded-2xl p-6"
                style={{background: 'var(--wm-surface)', border: '1px solid var(--wm-border)'}}
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({length: t.rating}).map((_, si) => (
                    <Star
                      key={si}
                      className="h-4 w-4"
                      style={{color: 'var(--wm-amber-dark)', fill: 'var(--wm-amber-dark)'}}
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed" style={{color: 'var(--wm-text)'}}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{background: 'var(--wm-grad-primary)'}}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{color: 'var(--wm-navy)'}}>{t.name}</p>
                    <p className="text-xs" style={{color: 'var(--wm-muted)'}}>{t.role}</p>
                  </div>
                </div>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOUNDING PRO BANNER ─── */}
      <section className="px-5 py-8 sm:px-8 lg:px-12">
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          transition={{duration: 0.5}}
          className="mx-auto max-w-5xl overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, var(--wm-navy) 0%, #0c1a2e 60%, #0a2a29 100%)',
            border: '1px solid rgba(var(--wm-primary-rgb), 0.25)',
          }}
        >
          <div className="relative px-8 py-10 sm:px-10 sm:py-12">
            {/* Decorative glow */}
            <div
              className="pointer-events-none absolute -right-16 -top-16"
              style={{
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(var(--wm-primary-rgb), 0.15) 0%, transparent 60%)',
                filter: 'blur(60px)',
              }}
            />

            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-lg">
                <div className="mb-3 flex items-center gap-3">
                  <Crown className="h-5 w-5" style={{color: 'var(--wm-amber)'}} />
                  <FoundingProBadge size="md" />
                </div>
                <h3
                  className="text-xl font-bold sm:text-2xl"
                  style={{color: 'white', fontFamily: 'var(--wm-font-display)', letterSpacing: '-0.02em'}}
                >
                  Join as a Founding Pro — Limited to first 100 providers.
                </h3>
                <p className="mt-3 text-sm leading-relaxed" style={{color: 'rgba(255,255,255,0.6)'}}>
                  Get 6 months free Pro features + a permanent Founding Pro badge on your profile.
                  Direct input into product development. Only 100 spots available nationwide.
                </p>
              </div>
              <Link
                href={withLocalePrefix(localeRoot, '/founding-pro')}
                className="inline-flex shrink-0 items-center gap-2 rounded-full px-8 py-4 text-sm font-bold transition-transform hover:scale-[1.03] active:scale-95"
                style={{
                  background: 'var(--wm-grad-warm, linear-gradient(135deg, var(--wm-amber-light), var(--wm-primary-faint)))',
                  color: 'var(--wm-navy)',
                  fontFamily: 'var(--wm-font-display)',
                  boxShadow: '0 8px 30px rgba(var(--wm-primary-rgb), 0.25)',
                }}
              >
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="px-5 py-8 pb-20 sm:px-8 lg:px-12">
        <div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-8 py-20 sm:px-16 sm:py-28"
          style={{
            background: 'linear-gradient(155deg, var(--wm-navy) 0%, #0c1a2e 50%, #0a2a29 100%)',
          }}
        >
          {/* Grid pattern */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          <div
            className="pointer-events-none absolute -right-20 -top-20"
            style={{
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(var(--wm-primary-rgb), 0.15) 0%, transparent 60%)',
              filter: 'blur(80px)',
            }}
          />

          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5}}
            >
              <h2
                style={{
                  fontFamily: 'var(--wm-font-display)',
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                }}
              >
                <span style={{color: 'white'}}>Ready to build</span>
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, var(--wm-primary) 0%, #34d399 50%, var(--wm-amber) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  your reputation?
                </span>
              </h2>

              <p
                className="mx-auto mt-5 max-w-md text-base leading-relaxed"
                style={{color: 'rgba(255,255,255,0.6)'}}
              >
                Join hundreds of Irish tradespeople who stopped paying for leads and
                started building their business on WorkMate.
              </p>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.15}}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href={withLocalePrefix(localeRoot, '/become-provider/apply')}
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold transition-transform hover:scale-[1.03] active:scale-95"
                style={{
                  background: 'white',
                  color: 'var(--wm-navy)',
                  fontFamily: 'var(--wm-font-display)',
                  boxShadow: '0 8px 32px rgba(255,255,255,0.12)',
                }}
              >
                Apply Now — Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={withLocalePrefix(localeRoot, '/pricing')}
                className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold"
                style={{
                  color: 'white',
                  background: 'var(--wm-grad-primary)',
                  boxShadow: '0 8px 30px rgba(var(--wm-primary-rgb), 0.3)',
                  fontFamily: 'var(--wm-font-display)',
                }}
              >
                See Full Pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
