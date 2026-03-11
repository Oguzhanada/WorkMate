'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Award,
  Check,
  Clock,
  Copy,
  Crown,
  Gift,
  Loader2,
  MessageSquareHeart,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';

import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import FoundingProBadge from '@/components/ui/FoundingProBadge';
import styles from './founding-pro.module.css';

/* ─── Types ────────────────────────────────────────────────────────────────── */

type ProgramStatus = {
  program_active: boolean;
  max_slots: number;
  current_count: number;
  slots_remaining: number;
  user_status: {
    is_founding_pro: boolean;
    is_provider: boolean;
    is_authenticated: boolean;
    referral_code?: string;
    referral_uses?: number;
    referral_max_uses?: number;
    founding_pro_joined_at?: string;
  };
};

type ClaimResponse = {
  success: boolean;
  slot_number: number;
  slots_remaining: number;
};

/* ─── Benefits Data ────────────────────────────────────────────────────────── */

const BENEFITS = [
  {
    icon: Zap,
    title: '6 Months Free Pro Features',
    desc: 'Get full access to Pro-tier features at no cost. Priority job matching, advanced analytics, and unlimited quotes.',
    accent: 'var(--wm-primary)',
    bg: 'var(--wm-primary-faint)',
  },
  {
    icon: Award,
    title: 'Permanent Founding Pro Badge',
    desc: 'A distinctive badge on your profile forever. Customers recognise you as one of the original WorkMate pioneers.',
    accent: 'var(--wm-amber-dark)',
    bg: 'var(--wm-amber-light)',
  },
  {
    icon: MessageSquareHeart,
    title: 'Direct Product Input',
    desc: 'Founding Pros have a direct line to the product team. Shape the features you need. Your feedback drives the roadmap.',
    accent: 'var(--wm-blue)',
    bg: 'var(--wm-blue-soft)',
  },
  {
    icon: Gift,
    title: 'Referral Program',
    desc: 'Earn your own unique referral code. Share WorkMate with other pros and build your professional network across Ireland.',
    accent: 'var(--wm-primary-dark)',
    bg: 'var(--wm-primary-light)',
  },
  {
    icon: Shield,
    title: 'Priority Verification',
    desc: 'Skip the queue for Garda Vetting and profile verification. Get verified and start earning faster than standard providers.',
    accent: 'var(--wm-navy)',
    bg: 'var(--wm-surface-alt)',
  },
  {
    icon: Crown,
    title: 'Early Adopter Recognition',
    desc: 'Be listed prominently in search results during launch. First to the platform means first to be found by customers.',
    accent: 'var(--wm-amber)',
    bg: 'var(--wm-amber-faint)',
  },
];

/* ─── Animation Variants ───────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const },
  },
};

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function FoundingProPage() {
  const pathname = usePathname() || '/';
  const localeRoot = useMemo(() => getLocaleRoot(pathname), [pathname]);

  const [status, setStatus] = useState<ProgramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<ClaimResponse | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /* ── Fetch program status ─────────────────────────────────────────────── */

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/founding-pro');
      if (!res.ok) throw new Error('Failed to load');
      const data: ProgramStatus = await res.json();
      setStatus(data);
    } catch {
      setClaimError('Unable to load program status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* ── Claim handler ────────────────────────────────────────────────────── */

  async function handleClaim() {
    setClaiming(true);
    setClaimError(null);

    try {
      const res = await fetch('/api/founding-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setClaimError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setClaimResult(data);
      // Refresh status to get referral code
      await fetchStatus();
    } catch {
      setClaimError('Network error. Please check your connection and try again.');
    } finally {
      setClaiming(false);
    }
  }

  /* ── Copy referral code ───────────────────────────────────────────────── */

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  /* ── Derived values ───────────────────────────────────────────────────── */

  const isFoundingPro = status?.user_status?.is_founding_pro || claimResult?.success;
  const slotsPercent = status
    ? Math.round((status.current_count / status.max_slots) * 100)
    : 0;
  const slotsRemaining = claimResult
    ? claimResult.slots_remaining
    : (status?.slots_remaining ?? 0);
  const programClosed = status ? !status.program_active && !isFoundingPro : false;

  /* ── Loading state ────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.skeleton} style={{ width: '12rem', height: '1.5rem', margin: '0 auto 1.5rem' }} />
            <div className={styles.skeleton} style={{ width: '100%', maxWidth: '28rem', height: '3rem', margin: '0 auto 1rem' }} />
            <div className={styles.skeleton} style={{ width: '80%', maxWidth: '24rem', height: '1rem', margin: '0 auto 2.5rem' }} />
            <div className={styles.skeleton} style={{ width: '100%', maxWidth: '28rem', height: '8rem', margin: '0 auto', borderRadius: 'var(--wm-radius-2xl)' }} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className={styles.page}>
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <motion.div
          className={styles.heroInner}
          initial="hidden"
          animate="visible"
          variants={scaleIn}
        >
          <span className={styles.heroLabel}>
            <Star style={{ width: 14, height: 14, color: 'var(--wm-amber)' }} />
            Limited to 100 Providers
          </span>

          {isFoundingPro ? (
            /* ── Already Claimed Hero ─────────────────────────────────────── */
            <div className={styles.claimedHero}>
              <FoundingProBadge size="md" />
              <h1 className={styles.heroTitle}>
                You&apos;re a <span className={styles.heroTitleAccent}>Founding Pro</span>
              </h1>
              {status?.user_status?.founding_pro_joined_at && (
                <p className={styles.claimedDate}>
                  Joined{' '}
                  {new Date(status.user_status.founding_pro_joined_at).toLocaleDateString('en-IE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
              {claimResult && (
                <motion.p
                  className={styles.successText}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ color: 'var(--wm-primary-dark)', fontWeight: 600 }}
                >
                  Slot #{claimResult.slot_number} claimed successfully!
                </motion.p>
              )}
            </div>
          ) : (
            /* ── Default Hero ─────────────────────────────────────────────── */
            <>
              <h1 className={styles.heroTitle}>
                Join Ireland&apos;s First 100{' '}
                <span className={styles.heroTitleAccent}>WorkMate Pros</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Be among the founding providers who shape how Ireland hires skilled tradespeople and service professionals.
                Limited slots. Permanent recognition.
              </p>
            </>
          )}

          {/* ── Slots Counter ──────────────────────────────────────────────── */}
          {status && (
            <motion.div
              className={styles.slotsCard}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className={styles.slotsLabel}>Slots Claimed</span>
              <div className={styles.slotsNumbers}>
                <span className={styles.slotsCount}>{status.current_count}</span>
                <span className={styles.slotsTotal}>/ {status.max_slots}</span>
              </div>
              <div className={styles.progressBarTrack}>
                <motion.div
                  className={styles.progressBarFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${slotsPercent}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <span className={slotsRemaining <= 20 ? `${styles.slotsRemaining} ${styles.slotsUrgent}` : styles.slotsRemaining}>
                {slotsRemaining === 0
                  ? 'All slots claimed'
                  : `${slotsRemaining} slot${slotsRemaining === 1 ? '' : 's'} remaining`}
                {slotsRemaining > 0 && slotsRemaining <= 20 && ' — limited availability'}
              </span>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── Benefits Grid ──────────────────────────────────────────────────── */}
      <section className={styles.benefitsSection}>
        <motion.h2
          className={styles.sectionTitle}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          custom={0}
        >
          What Founding Pros Get
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          custom={1}
        >
          Exclusive benefits for the first 100 providers to join WorkMate. These perks are permanent and cannot be earned later.
        </motion.p>

        <div className={styles.benefitsGrid}>
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              className={styles.benefitCard}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              custom={i + 2}
            >
              <div
                className={styles.benefitIcon}
                style={{ background: b.bg, color: b.accent }}
              >
                <b.icon style={{ width: 22, height: 22 }} />
              </div>
              <h3 className={styles.benefitTitle}>{b.title}</h3>
              <p className={styles.benefitDesc}>{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA / Claim Section ────────────────────────────────────────────── */}
      {!isFoundingPro && (
        <section className={styles.ctaSection}>
          {programClosed ? (
            /* ── Program Closed ──────────────────────────────────────────── */
            <motion.div
              className={styles.closedBanner}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <h3 className={styles.closedTitle}>All 100 Slots Have Been Claimed</h3>
              <p className={styles.closedText}>
                The Founding Pro program is fully subscribed. You can still{' '}
                <Link
                  href={withLocalePrefix(localeRoot, '/become-provider')}
                  className={styles.ctaLoginLink}
                >
                  join as a regular provider
                </Link>{' '}
                and access all standard features.
              </p>
            </motion.div>
          ) : (
            /* ── Claim CTA ──────────────────────────────────────────────── */
            <>
              {claimError && (
                <motion.div
                  className={styles.errorBanner}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {claimError}
                </motion.div>
              )}

              {status?.user_status?.is_authenticated ? (
                status.user_status.is_provider ? (
                  <motion.button
                    className={styles.ctaButton}
                    onClick={handleClaim}
                    disabled={claiming}
                    whileHover={claiming ? {} : { scale: 1.02 }}
                    whileTap={claiming ? {} : { scale: 0.98 }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={scaleIn}
                  >
                    {claiming ? (
                      <>
                        <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                        Claiming Your Slot...
                      </>
                    ) : (
                      <>
                        <Rocket style={{ width: 20, height: 20 }} />
                        Claim My Founding Pro Slot
                      </>
                    )}
                  </motion.button>
                ) : (
                  <div>
                    <p className={styles.ctaNote} style={{ marginBottom: '1rem' }}>
                      You need a provider account to claim a Founding Pro slot.
                    </p>
                    <Link
                      href={withLocalePrefix(localeRoot, '/become-provider/apply')}
                      className={styles.ctaButton}
                      style={{ textDecoration: 'none', display: 'inline-flex' }}
                    >
                      <Sparkles style={{ width: 20, height: 20 }} />
                      Become a Provider First
                    </Link>
                  </div>
                )
              ) : (
                <div>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={scaleIn}
                  >
                    <Link
                      href={withLocalePrefix(localeRoot, '/become-provider/apply')}
                      className={styles.ctaButton}
                      style={{ textDecoration: 'none', display: 'inline-flex' }}
                    >
                      <Sparkles style={{ width: 20, height: 20 }} />
                      Sign Up as a Provider
                    </Link>
                  </motion.div>
                  <p className={styles.ctaLogin}>
                    Already have an account?{' '}
                    <Link href={withLocalePrefix(localeRoot, '/auth/login')} className={styles.ctaLoginLink}>
                      Log in
                    </Link>{' '}
                    to claim your slot.
                  </p>
                </div>
              )}

              <p className={styles.ctaNote}>
                No payment required. Your Founding Pro status is permanent once claimed.
              </p>
            </>
          )}
        </section>
      )}

      {/* ── Referral Section (shown when user is a Founding Pro) ────────── */}
      {isFoundingPro && status?.user_status?.referral_code && (
        <section className={styles.referralSection}>
          <motion.div
            className={styles.referralCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <h3 className={styles.referralTitle}>
              <Gift style={{ width: 20, height: 20, color: 'var(--wm-amber-dark)' }} />
              Your Referral Code
            </h3>
            <p className={styles.referralSubtext}>
              Share your code with other service providers. When they join WorkMate using your code, both of you benefit from the growing network.
            </p>

            <div className={styles.referralCodeRow}>
              <div className={styles.referralCodeValue}>
                {status.user_status.referral_code}
              </div>
              <button
                className={styles.copyButton}
                onClick={() => handleCopy(status.user_status.referral_code!)}
                title="Copy referral code"
                type="button"
              >
                {copied ? (
                  <Check style={{ width: 18, height: 18, color: 'var(--wm-primary)' }} />
                ) : (
                  <Copy style={{ width: 18, height: 18 }} />
                )}
              </button>
            </div>

            <div className={styles.referralStats}>
              <Users style={{ width: 16, height: 16 }} />
              <span>
                <span className={styles.referralStatsCount}>
                  {status.user_status.referral_uses ?? 0}
                </span>
                {' '}of{' '}
                {status.user_status.referral_max_uses ?? 10} referrals used
              </span>
            </div>
          </motion.div>
        </section>
      )}

      {/* ── Referral section for just-claimed users waiting for code ──────── */}
      {isFoundingPro && !status?.user_status?.referral_code && (
        <section className={styles.referralSection}>
          <div className={styles.referralCard} style={{ textAlign: 'center' }}>
            <p className={styles.referralSubtext} style={{ margin: 0 }}>
              <Clock style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Your referral code is being generated. Refresh the page in a moment to see it.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
