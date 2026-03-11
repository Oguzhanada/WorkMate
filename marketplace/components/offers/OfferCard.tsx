'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  Shield,
  Star,
} from 'lucide-react';
import type { OfferRanking } from '@/lib/types/airtasker';
import ComplianceBadge from '@/components/ui/ComplianceBadge';
import OfferCountdownBadge from './OfferCountdownBadge';
import AcceptOfferModal from './AcceptOfferModal';
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
      complianceScore?: number;
      isSameDayAvailable?: boolean;
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

type ExpiryUrgency = 'critical' | 'urgent' | 'normal' | null;

function getExpiryInfo(dateIso?: string): { text: string | null; urgency: ExpiryUrgency } {
  if (!dateIso) return { text: null, urgency: null };
  const date = new Date(dateIso);
  const now = new Date();
  if (Number.isNaN(date.getTime())) return { text: null, urgency: null };

  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return { text: 'Expired', urgency: 'critical' };

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHrs < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return { text: `Expires in ${Math.max(1, diffMins)}m`, urgency: 'critical' };
  }
  if (diffHrs <= 12) return { text: `Expires in ${diffHrs}h`, urgency: 'critical' };
  if (diffHrs <= 24) return { text: `Expires in ${diffHrs}h`, urgency: 'urgent' };

  const days = Math.floor(diffHrs / 24);
  return {
    text: `Expires in ${days} ${days === 1 ? 'day' : 'days'}`,
    urgency: 'normal',
  };
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { text: expiryText, urgency: expiryUrgency } = useMemo(
    () => getExpiryInfo(offer.expiresAt),
    [offer.expiresAt]
  );
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
        {offer.provider.isSameDayAvailable ? (
          <span className={`${styles.badge} ${styles.badgeSameDay}`}>
            <CalendarCheck className={styles.badgeIcon} />
            Same-Day Available
          </span>
        ) : null}
        {isRebooking ? <span className={`${styles.badge} ${styles.badgeRebook}`}>Repeat booking discount active</span> : null}
        {ranking.breakdown?.matchPercentage && ranking.breakdown.matchPercentage >= 70 ? (
          <span className={`${styles.badge} ${styles.badgeMatch}`}>
            <Award className={styles.badgeIcon} />
            {ranking.breakdown.matchPercentage}% Match
          </span>
        ) : null}
        {expiryUrgency === 'critical' && expiryText ? (
          <span className={`${styles.expiryBadge} ${styles.expiryCritical}`}>
            <Clock className={styles.badgeIcon} />
            {expiryText}
          </span>
        ) : null}
        {expiryUrgency === 'urgent' && expiryText ? (
          <span className={`${styles.expiryBadge} ${styles.expiryUrgent}`}>
            <Clock className={styles.badgeIcon} />
            {expiryText}
          </span>
        ) : null}
        {/* 48h countdown from createdAt — only shown when expiresAt is not set */}
        {!offer.expiresAt ? (
          <OfferCountdownBadge createdAt={offer.createdAt} status={offer.status} />
        ) : null}
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
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={styles.providerName} onClick={() => onViewProfile(offer.provider.id)}>
              {offer.provider.businessName}
            </button>
            <ComplianceBadge score={offer.provider.complianceScore ?? 0} />
          </div>
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

      {expiryUrgency === 'normal' && expiryText ? <p className={styles.expiry}>{expiryText}</p> : null}

      <button type="button" className={styles.toggle} onClick={() => setShowDetails((current) => !current)}>
        {showDetails ? <ChevronUp className={styles.toggleIcon} /> : <ChevronDown className={styles.toggleIcon} />}
        {showDetails ? 'Hide details' : 'Show details'}
      </button>

      {showDetails ? (
        <div className={styles.details}>
          <p className={styles.description}>{offer.description || 'No additional message provided.'}</p>
          <p className={styles.score}>
            Smart {ranking.breakdown.smartScore} (base {ranking.score} ×{ranking.breakdown.complianceMultiplier}) • Price {ranking.breakdown.priceScore} • Rating {ranking.breakdown.ratingScore} •
            Response {ranking.breakdown.responseScore} • Trust {ranking.breakdown.trustScore}
          </p>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.accept} onClick={() => setShowConfirmModal(true)}>
          Accept offer
        </button>
        <button type="button" className={styles.message} onClick={() => onMessage(offer.provider.id)}>
          <MessageSquare className={styles.messageIcon} />
          Message
        </button>
      </div>

      {showConfirmModal ? (
        <AcceptOfferModal
          priceCents={offer.priceCents}
          providerName={offer.provider.businessName}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={() => {
            setShowConfirmModal(false);
            onAccept(offer.id);
          }}
        />
      ) : null}
    </motion.article>
  );
}
