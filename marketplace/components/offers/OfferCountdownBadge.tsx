'use client';

import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Clock } from 'lucide-react';
import styles from './offer-card.module.css';

const OFFER_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const URGENT_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours

type Urgency = 'normal' | 'urgent' | 'critical' | 'expired';

interface CountdownState {
  text: string;
  urgency: Urgency;
}

function computeCountdown(createdAt: string): CountdownState {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return { text: '', urgency: 'normal' };

  const expiresAt = created + OFFER_TTL_MS;
  const remainingMs = expiresAt - Date.now();

  if (remainingMs <= 0) return { text: 'Expired', urgency: 'expired' };

  const totalMins = Math.floor(remainingMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  let text: string;
  if (hours === 0) {
    text = `Expires in ${mins}m`;
  } else if (mins === 0) {
    text = `Expires in ${hours}h`;
  } else {
    text = `Expires in ${hours}h ${mins}m`;
  }

  const urgency: Urgency = remainingMs <= URGENT_THRESHOLD_MS ? 'urgent' : 'normal';
  return { text, urgency };
}

type Props = {
  createdAt: string;
  status: string;
};

export default function OfferCountdownBadge({ createdAt, status }: Props) {
  const [state, setState] = useState<CountdownState>(() => computeCountdown(createdAt));

  useEffect(() => {
    // Recompute immediately in case of hydration offset
    setState(computeCountdown(createdAt));

    const id = setInterval(() => {
      const next = computeCountdown(createdAt);
      setState(next);
      if (next.urgency === 'expired') clearInterval(id);
    }, 60_000);

    return () => clearInterval(id);
  }, [createdAt]);

  // Only show for pending offers
  if (status !== 'pending') return null;
  // Don't render until we have a valid state
  if (!state.text) return null;

  const isExpired = state.urgency === 'expired';
  const isUrgent = state.urgency === 'urgent';

  const badgeClass = isExpired || isUrgent ? styles.expiryCritical : styles.expiryUrgent;

  // Pulse animation only when urgent or expired
  const pulseVariants: Variants = {
    idle: { scale: 1, opacity: 1 },
    pulse: {
      scale: [1, 1.06, 1],
      opacity: [1, 0.85, 1],
      transition: { duration: 1.8, repeat: Infinity, ease: [0.42, 0, 0.58, 1] },
    },
  };

  return (
    <motion.span
      className={`${styles.expiryBadge} ${badgeClass}`}
      variants={pulseVariants}
      animate={isUrgent || isExpired ? 'pulse' : 'idle'}
      aria-label={state.text}
    >
      <Clock className={styles.badgeIcon} aria-hidden="true" />
      {state.text}
    </motion.span>
  );
}
