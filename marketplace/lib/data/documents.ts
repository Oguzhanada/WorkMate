export type ProviderDocumentType =
  | 'id_verification'
  | 'safe_pass'
  | 'public_liability_insurance'
  | 'tax_clearance'
  | 'trade_license'
  | 'other';

export type ProviderDocumentStatus = 'verified' | 'pending' | 'rejected' | 'unverified';

export const PROVIDER_DOCUMENT_LABELS: Record<ProviderDocumentType, string> = {
  id_verification: 'Identity Document',
  safe_pass: 'Safe Pass',
  public_liability_insurance: 'Public Liability Insurance',
  tax_clearance: 'Tax Clearance Certificate',
  trade_license: 'Trade License',
  other: 'Other Supporting Document',
};

export const PROVIDER_REQUIRED_DOCUMENTS: ProviderDocumentType[] = [
  'id_verification',
  'safe_pass',
  'public_liability_insurance',
  'tax_clearance',
];

export type ProviderDocumentDraft = {
  type: ProviderDocumentType;
  file: File | null;
  expiresAt?: string;
  coverageAmountEur?: string;
  croNumber?: string;
  licenseCode?: string;
  otherDescription?: string;
};

function isFutureDate(value?: string) {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed >= today;
}

export function validateProviderDocumentDraft(draft: ProviderDocumentDraft) {
  if (!draft.file) return 'Please select a file.';

  if (draft.type === 'safe_pass' && !isFutureDate(draft.expiresAt)) {
    return 'Safe Pass requires a valid future expiry date.';
  }

  if (draft.type === 'public_liability_insurance') {
    const coverage = Number(draft.coverageAmountEur ?? 0);
    if (!Number.isFinite(coverage) || coverage < 6500000) {
      return 'Insurance cover must be at least 6,500,000 EUR.';
    }
    if (!isFutureDate(draft.expiresAt)) {
      return 'Insurance requires a valid future expiry date.';
    }
  }

  if (draft.type === 'tax_clearance') {
    if (!isFutureDate(draft.expiresAt)) {
      return 'Tax Clearance requires a valid future expiry date.';
    }
    if (!draft.croNumber || draft.croNumber.trim().length < 5) {
      return 'Tax Clearance requires a CRO number.';
    }
  }

  if (draft.type === 'trade_license' && !draft.licenseCode?.trim()) {
    return 'Trade License requires a license code or registration number.';
  }

  if (draft.type === 'other' && !draft.otherDescription?.trim()) {
    return 'Please describe the "Other" document type.';
  }

  return null;
}

/** Document badges displayed on provider public profiles when document is verified */
export const PROVIDER_DOCUMENT_BADGES: Partial<Record<ProviderDocumentType, { icon: string; label: string }>> = {
  id_verification:            { icon: '✅', label: 'ID Verified' },
  public_liability_insurance: { icon: '🛡️', label: 'Insured' },
  tax_clearance:              { icon: '💼', label: 'Tax Cleared' },
  safe_pass:                  { icon: '⛑️', label: 'Safe Pass' },
  trade_license:              { icon: '🔧', label: 'Licensed' },
};

export function getDocumentStatusBadge(status: ProviderDocumentStatus, expiresAt?: string | null) {
  if (status === 'rejected') return '❌ Rejected';
  if (status === 'pending') return '⏳ Pending';
  if (status === 'verified') {
    if (expiresAt) {
      const expiry = new Date(expiresAt);
      const diffDays = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) return '⚠️ Expiring soon';
    }
    return '✅ Approved';
  }
  return '• Not uploaded';
}
