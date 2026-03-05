export type ProviderVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type IdVerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

type ResolveProviderVerificationInput = {
  currentVerificationStatus: string;
  currentIdVerificationStatus: string;
  uploadedIdPath: string | null;
};

type ResolveProviderVerificationResult = {
  nextProviderVerificationStatus: ProviderVerificationStatus;
  nextIdVerificationStatus: IdVerificationStatus;
  nextIsVerified: boolean;
  shouldSetIdSubmittedAt: boolean;
};

const PROVIDER_STATUSES: ProviderVerificationStatus[] = ['unverified', 'pending', 'verified', 'rejected'];
const ID_STATUSES: IdVerificationStatus[] = ['none', 'pending', 'approved', 'rejected'];

function asProviderStatus(value: string): ProviderVerificationStatus {
  return PROVIDER_STATUSES.includes(value as ProviderVerificationStatus)
    ? (value as ProviderVerificationStatus)
    : 'unverified';
}

function asIdStatus(value: string): IdVerificationStatus {
  return ID_STATUSES.includes(value as IdVerificationStatus)
    ? (value as IdVerificationStatus)
    : 'none';
}

export function resolveProviderVerificationState(
  input: ResolveProviderVerificationInput
): ResolveProviderVerificationResult {
  const currentProviderStatus = asProviderStatus(input.currentVerificationStatus);
  const currentIdStatus = asIdStatus(input.currentIdVerificationStatus);
  const hasNewIdUpload = Boolean(input.uploadedIdPath);

  const nextProviderVerificationStatus =
    currentProviderStatus === 'verified' ? 'verified' : 'pending';
  const nextIdVerificationStatus =
    currentIdStatus === 'approved' ? 'approved' : hasNewIdUpload ? 'pending' : currentIdStatus;

  return {
    nextProviderVerificationStatus,
    nextIdVerificationStatus,
    nextIsVerified: nextProviderVerificationStatus === 'verified',
    shouldSetIdSubmittedAt: hasNewIdUpload,
  };
}
