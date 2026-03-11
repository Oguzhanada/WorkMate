"use client";

import { motion } from 'framer-motion';
import { ShieldCheck, Wrench, Zap, Sparkles, TreePine, PaintBucket, Truck, Check } from 'lucide-react';
import WorkMateLogo from '@/components/ui/WorkMateLogo';

import styles from './login.module.css';
import { leftColumnVariants } from '@/styles/animations';

const SERVICE_CATEGORIES = [
  { icon: Wrench,      label: 'Plumbing & Boilers' },
  { icon: Zap,         label: 'Electrical' },
  { icon: Sparkles,    label: 'Cleaning' },
  { icon: TreePine,    label: 'Gardening' },
  { icon: PaintBucket, label: 'Painting & Decorating' },
  { icon: Truck,       label: 'Moving & Removals' },
];

const TRUST_POINTS = [
  'Admin-verified professional profiles',
  'Secure Stripe payments — released only on completion',
  'Genuine reviews from real customers',
  'GDPR compliant · Ireland-based platform',
];

export function BrandColumn() {
  return (
    <motion.section
      className={`${styles.panel} ${styles.brandPanel}`}
      variants={leftColumnVariants}
      initial="hidden"
      animate="visible"
      aria-label="WorkMate brand highlights"
    >
      {/* Logo row */}
      <div className={styles.logoRow}>
        <div className={styles.logoBadge}>
          <WorkMateLogo size={44} />
        </div>
        <div>
          <h1 className={styles.brandTitle}>WorkMate</h1>
          <p className={styles.brandSubtitle}>Trusted local services across Ireland</p>
        </div>
      </div>

      {/* Testimonial card */}
      <article className={styles.quoteCard}>
        <p className={styles.quoteStars}>★★★★★</p>
        <p className={styles.quoteText}>
          &ldquo;Found an excellent electrician within the hour. Job done the next morning.
          Unbelievable service.&rdquo;
        </p>
        <p className={styles.quoteMeta}>Sinéad · Dublin 14</p>
      </article>

      {/* Service categories */}
      <div style={{ marginTop: 22 }}>
        <p
          style={{
            margin: '0 0 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--wm-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          Available services
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
          }}
        >
          {SERVICE_CATEGORIES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 'var(--wm-radius-md)',
                border: '1px solid var(--wm-border)',
                background: 'white',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--wm-navy)',
              }}
            >
              <Icon size={14} aria-hidden="true" style={{ color: 'var(--wm-primary)', flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Trust points */}
      <div style={{ marginTop: 18 }}>
        {TRUST_POINTS.map((point) => (
          <div
            key={point}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 8,
              fontSize: '0.82rem',
              color: 'var(--wm-muted)',
            }}
          >
            <ShieldCheck
              size={14}
              aria-hidden="true"
              style={{ color: 'var(--wm-primary)', flexShrink: 0, marginTop: 1 }}
            />
            {point}
          </div>
        ))}
      </div>

      {/* Badge pills */}
      <div className={styles.badges}>
        <span className={styles.badgePill}>
          <Check size={11} aria-hidden="true" />
          26 counties
        </span>
        <span className={styles.badgePill}>
          <Check size={11} aria-hidden="true" />
          GDPR Compliant
        </span>
        <span className={styles.badgePill}>
          <Check size={11} aria-hidden="true" />
          Free to post
        </span>
      </div>
    </motion.section>
  );
}
