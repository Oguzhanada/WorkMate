'use client';

import { motion } from 'framer-motion';
import styles from './offer-ranking-badge.module.css';

type Props = {
  score: number;
};

export default function OfferRankingBadge({ score }: Props) {
  return (
    <motion.span
      className={styles.badge}
      initial={{ scale: 0.65, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24, delay: 0.06 }}
      role="img"
      aria-label={`Top Offer — ranking score ${score}`}
    >
      <span aria-hidden="true">⭐</span>
      TOP OFFER
      <span className={styles.tooltip} role="tooltip">
        Highest ranked offer based on price, response time, rating and Irish compliance
      </span>
    </motion.span>
  );
}
