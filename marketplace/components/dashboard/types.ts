export type AdminDashboardData = {
  pros: number;
  customers: number;
  openJobs: number;
  activeJobs: number;
  completedJobs: number;
  pendingVerification: number;
  rejectedVerification: number;
  pendingDocs: number;
  totalReviews: number;
  activeSubs: number;
  newUsers7d: number;
  auditTotal: number;
  recentAuditLogs: { action: string; target_type: string; created_at: string }[];
  featureFlags: { flag_key: string; enabled: boolean }[];
  weeklyRegistrations: { day: string; count: number }[];
  dateLabel: string;
};

export type CustomerDashboardData = {
  fullName: string | null;
  openJobs: number;
  completedJobs: number;
  activeQuotes: number;
  savedProviders: number;
  recentJobs: { id: string; title: string; status: string; created_at: string }[];
};

export type ProDashboardData = {
  fullName: string | null;
  isFoundingPro: boolean;
  isIdVerified: boolean;
  hasServices: boolean;
  pendingAlerts: number;
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  avgRating: number | null;
  reviewCount: number;
};
