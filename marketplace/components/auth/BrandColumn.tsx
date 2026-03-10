"use client";

import {motion} from 'framer-motion';
import {ShieldCheck, Star, Users, Zap} from 'lucide-react';
import WorkMateLogo from '@/components/ui/WorkMateLogo';

import styles from './login.module.css';
import {leftColumnVariants} from '@/styles/animations';

const stats = [
  {icon: Users, value: 'Growing', label: 'Pro network'},
  {icon: ShieldCheck, value: 'All', label: 'Verified pros'},
  {icon: Star, value: '26', label: 'Counties'}
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

      {/* Quote card */}
      <article className={styles.quoteCard}>
        <p className={styles.quoteText}>&ldquo;Connecting Irish homeowners with trusted local professionals.&rdquo;</p>
        <p className={styles.quoteMeta}>WorkMate</p>
      </article>

      {/* Stats */}
      <div className={styles.statGrid}>
        {stats.map((item) => (
          <div key={item.label} className={styles.statItem}>
            <item.icon size={16} aria-hidden="true" className={styles.statIcon} />
            <p className={styles.statValue}>{item.value}</p>
            <p className={styles.statLabel}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Badge pills */}
      <div className={styles.badges}>
        <span className={styles.badgePill}>🇮🇪 26 counties</span>
        <span className={styles.badgePill}>🔒 GDPR Compliant</span>
        <span className={styles.badgePill}><Zap size={12} aria-hidden="true" /> Trust verified</span>
      </div>
    </motion.section>
  );
}
