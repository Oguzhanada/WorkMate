'use client';

import { useRouter } from 'next/navigation';
import OfferCard from '@/components/offers/OfferCard';
import EmptyState from '@/components/ui/EmptyState';
import type { OfferRanking } from '@/lib/types/airtasker';
import { acceptOffer } from '@/app/actions/offers';

export type OfferData = {
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
    complianceScore: number;
  };
  ranking: OfferRanking;
  isRebooking: boolean;
};

type Props = {
  offers: OfferData[];
  locale: string;
};

export default function JobOffersClient({ offers, locale }: Props) {
  const router = useRouter();

  const handleAccept = async (offerId: string) => {
    await acceptOffer(offerId);
    router.refresh();
  };

  const handleMessage = (providerId: string) => {
    router.push(`/${locale}/messages?with=${providerId}`);
  };

  const handleViewProfile = (providerId: string) => {
    router.push(`/${locale}/profile/public/${providerId}`);
  };

  if (offers.length === 0) {
    return (
      <EmptyState
        title="No offers yet"
        description="Verified providers will submit offers once your job is approved."
      />
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <OfferCard
          key={offer.id}
          offer={offer}
          ranking={offer.ranking}
          isRebooking={offer.isRebooking}
          onAccept={handleAccept}
          onMessage={handleMessage}
          onViewProfile={handleViewProfile}
        />
      ))}
    </div>
  );
}
