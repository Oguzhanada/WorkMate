"use client";

import {motion} from 'framer-motion';
import {CheckCircle2, UsersRound, Zap} from 'lucide-react';

import styles from './login.module.css';
import {leftColumnVariants} from '@/styles/animations';

const stats = [
  {value: '500+', label: 'Active workers'},
  {value: '10k+', label: 'Completed tasks'},
  {value: '4.9/5', label: 'Customer rating'}
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
      <div className={styles.logoRow}>
        <div className={styles.logoBadge}>
          <UsersRound size={30} aria-hidden="true" />
        </div>
        <div>
          <h1 className={styles.brandTitle}>WorkMate</h1>
          <p className={styles.brandSubtitle}>Find your work mate in Ireland</p>
        </div>
      </div>

      <article className={styles.quoteCard}>
        <p className={styles.quoteText}>"I found 3 jobs in one week!"</p>
        <p className={styles.stars}>★★★★★</p>
        <p className={styles.quoteMeta}>- Michael, Cork</p>
      </article>

      <div className={styles.statGrid}>
        {stats.map((item) => (
          <div key={item.label} className={styles.statItem}>
            <CheckCircle2 size={18} aria-hidden="true" />
            <p className={styles.statValue}>{item.value}</p>
            <p className={styles.statLabel}>{item.label}</p>
          </div>
        ))}
      </div>

      <div className={styles.badges}>
        <span className={styles.badgePill}>🇮🇪 26 counties</span>
        <span className={styles.badgePill}>GDPR Compliant</span>
        <span className={styles.badgePill}>
          <Zap size={14} aria-hidden="true" /> Trusted verification flow
        </span>
      </div>
    </motion.section>
  );
}
