export type ReviewType = 'provider_application' | 'customer_identity_review' | 'other';

export type ProviderPayload = {
  application_status?: string;
  personal_info?: { primary_city?: string };
  services_and_skills?: {
    services?: string[];
    experience_range?: string;
    availability?: string | string[];
  };
  areas_served?: { cities?: string[]; radius?: string };
  admin_review?: {
    decision?: 'approve' | 'reject' | 'request_changes';
    note?: string;
    reviewed_at?: string;
    reviewed_by?: string;
    reviewed_by_email?: string;
  };
};

export type Application = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  verification_status: string;
  id_verification_status?: string;
  created_at: string;
  address?: { county?: string | null; locality?: string | null; eircode?: string | null } | null;
  stripe_requirements_due: ProviderPayload | null;
  documents: Array<{
    id?: string;
    document_type: string;
    verification_status?: string;
    signed_url?: string | null;
    download_url?: string | null;
    preview_url?: string | null;
    expires_at?: string | null;
    rejection_reason?: string | null;
    metadata?: Record<string, unknown>;
    created_at: string;
  }>;
  review_type?: ReviewType;
};

export type AuditLog = {
  id: string;
  admin_email?: string | null;
  action: string;
  target_type: string;
  target_profile_id?: string | null;
  target_label?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
};

export type SortField =
  | 'full_name'
  | 'review_type'
  | 'category'
  | 'county'
  | 'created_at'
  | 'documents'
  | 'verification_status';

export type Filters = {
  q: string;
  status: string;
  review_type: string;
  category: string;
  county: string;
  date_range: '7d' | '30d' | '90d' | 'all';
  start_date: string;
  end_date: string;
  id_verification_status: 'all' | 'none' | 'pending' | 'approved' | 'rejected';
  has_documents: 'any' | 'yes' | 'no';
};

export type Decision = 'approve' | 'reject' | 'request_changes';

export type DashboardStats = {
  totalUsers: number;
  pendingApps: number;
  approvedApps: number;
  rejectedApps: number;
  revenue: number;
  approvalRate: number;
};

export type ActionModalState =
  | {
      kind: 'single_decision';
      profileId: string;
      decision: Decision;
      title: string;
      submitLabel: string;
      defaultValue: string;
    }
  | {
      kind: 'bulk_decision';
      profileIds: string[];
      decision: 'approve' | 'reject';
      title: string;
      submitLabel: string;
      defaultValue: string;
    }
  | {
      kind: 'message';
      profileIds: string[];
      title: string;
      submitLabel: string;
      defaultValue: string;
    }
  | {
      kind: 'approve_all_documents';
      profileId: string;
      title: string;
      submitLabel: string;
      defaultValue: string;
    };

export const DEFAULT_FILTERS: Filters = {
  q: '',
  status: 'all',
  review_type: 'customer_identity_review',
  category: 'all',
  county: 'all',
  date_range: 'all',
  start_date: '',
  end_date: '',
  id_verification_status: 'all',
  has_documents: 'any',
};
