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
      initial={{ scale: 0.85, opacity: 0, y: 5 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
