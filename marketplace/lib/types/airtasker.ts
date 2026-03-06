export type JobMode = 'quick_hire' | 'direct_request' | 'get_quotes';

export type TaskType = 'in_person' | 'remote' | 'flexible';

export type UrgencyLevel = 'asap' | 'this_week' | 'flexible';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';

export interface TaskAlert {
  id: string;
  providerId: string;
  keywords: string[];
  categories: string[];
  counties: string[];
  taskTypes: TaskType[];
  budgetMin?: number;
  urgencyLevels: UrgencyLevel[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OfferRanking {
  score: number;
  breakdown: {
    priceScore: number;
    ratingScore: number;
    responseScore: number;
    matchScore: number;
    trustScore: number;
    matchPercentage: number;
    smartScore: number;
    complianceMultiplier: number;
  };
  badge?: 'TOP_OFFER' | 'TRUSTED_PRO' | 'FAST_RESPONDER';
}

export interface ProviderRanking {
  providerId: string;
  avgRating: number;
  reviewCount: number;
  completedJobs: number;
  avgResponseHours: number;
  idVerifiedScore: number;
  taxClearanceScore: number;
  insuranceScore: number;
  safePassScore: number;
  totalTrustScore: number;
  complianceScore: number;
}

export interface RebookingInfo {
  hasWorkedBefore: boolean;
  jobsCompleted: number;
  lastJobAt?: string;
  totalSpent: number;
  isFavorite: boolean;
  discountRate: number;
}

export interface FeeCalculation {
  subtotal: number;
  serviceFee: number;
  transactionFee: number;
  total: number;
  savings?: number;
  isRebooking: boolean;
}
