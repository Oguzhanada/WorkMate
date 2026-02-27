'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  Shield,
  Star,
} from 'lucide-react';
import type { OfferRanking } from '@/lib/types/airtasker';
import styles from './offer-card.module.css';

type OfferCardProps = {
  offer: {
    id: string;
    priceCents: number;
    description: string;
    estimatedDuration?: string;
    createdAt: string;
    expiresAt?: string;
    status: string;
    provider: {
      id: string;
      businessName: string;
      avatarUrl?: string;
      rating: number;
      reviewCount: number;
      completedJobs: number;
      hasTaxClearance: boolean;
      hasInsurance: boolean;
      hasSafePass: boolean;
    };
  };
  ranking: OfferRanking;
  isRebooking?: boolean;
  onAccept: (offerId: string) => void;
  onMessage: (providerId: string) => void;
  onViewProfile: (providerId: string) => void;
};

function formatCurrencyFromCents(cents: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    Math.max(cents, 0) / 100
  );
}

function formatDateLabel(dateIso?: string) {
  if (!dateIso) return '';
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getInitials(value: string) {
  return value
    .split(' ')
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function OfferCard({
  offer,
  ranking,
  isRebooking,
  onAccept,
  onMessage,
  onViewProfile,
}: OfferCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const expiryText = useMemo(() => formatDateLabel(offer.expiresAt), [offer.expiresAt]);
  const isTopOffer = ranking.badge === 'TOP_OFFER';

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${styles.card} ${isTopOffer ? styles.cardTop : ''}`}
      data-testid={`offer-card-${offer.id}`}
    >
      <div className={styles.badges}>
        {ranking.badge === 'TOP_OFFER' ? <span className={`${styles.badge} ${styles.badgeTop}`}>Top Offer</span> : null}
        {ranking.badge === 'TRUSTED_PRO' ? (
          <span className={`${styles.badge} ${styles.badgeTrusted}`}>
            <Shield className={styles.badgeIcon} />
            Trusted Pro
          </span>
        ) : null}
        {ranking.badge === 'FAST_RESPONDER' ? (
          <span className={`${styles.badge} ${styles.badgeFast}`}>
            <Clock className={styles.badgeIcon} />
            Fast Responder
          </span>
        ) : null}
        {isRebooking ? <span className={`${styles.badge} ${styles.badgeRebook}`}>Repeat booking discount active</span> : null}
      </div>

      <div className={styles.main}>
        <button type="button" className={styles.avatar} onClick={() => onViewProfile(offer.provider.id)}>
          {offer.provider.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={offer.provider.avatarUrl} alt={offer.provider.businessName} className={styles.avatarImage} />
          ) : (
            <span>{getInitials(offer.provider.businessName)}</span>
          )}
        </button>

        <div className={styles.provider}>
          <button type="button" className={styles.providerName} onClick={() => onViewProfile(offer.provider.id)}>
            {offer.provider.businessName}
          </button>
          <p className={styles.meta}>
            <Star className={styles.metaIconStar} />
            {offer.provider.rating.toFixed(1)} ({offer.provider.reviewCount}) • {offer.provider.completedJobs} jobs
          </p>
          <div className={styles.docBadges}>
            {offer.provider.hasTaxClearance ? (
              <span className={styles.docBadge}>
                <CheckCircle2 className={styles.docIcon} />
                Tax Clearance
              </span>
            ) : null}
            {offer.provider.hasInsurance ? (
              <span className={styles.docBadge}>
                <Shield className={styles.docIcon} />
                Insured
              </span>
            ) : null}
            {offer.provider.hasSafePass ? (
              <span className={styles.docBadge}>
                <Award className={styles.docIcon} />
                Safe Pass
              </span>
            ) : null}
          </div>
        </div>

        <div className={styles.priceBlock}>
          <p className={styles.price}>{formatCurrencyFromCents(offer.priceCents)}</p>
          {offer.estimatedDuration ? <p className={styles.meta}>Est. {offer.estimatedDuration}</p> : null}
        </div>
      </div>

      {expiryText ? <p className={styles.expiry}>Offer valid until {expiryText}</p> : null}

      <button type="button" className={styles.toggle} onClick={() => setShowDetails((current) => !current)}>
        {showDetails ? <ChevronUp className={styles.toggleIcon} /> : <ChevronDown className={styles.toggleIcon} />}
        {showDetails ? 'Hide details' : 'Show details'}
      </button>

      {showDetails ? (
        <div className={styles.details}>
          <p className={styles.description}>{offer.description || 'No additional message provided.'}</p>
          <p className={styles.score}>
            Score {ranking.score} • Price {ranking.breakdown.priceScore} • Rating {ranking.breakdown.ratingScore} •
            Response {ranking.breakdown.responseScore} • Trust {ranking.breakdown.trustScore}
          </p>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.accept} onClick={() => onAccept(offer.id)}>
          Accept offer
        </button>
        <button type="button" className={styles.message} onClick={() => onMessage(offer.provider.id)}>
          <MessageSquare className={styles.messageIcon} />
          Message
        </button>
      </div>
    </motion.article>
  );
}
