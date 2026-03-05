import { describe, expect, it } from 'vitest';

import { resolveProviderVerificationState } from '@/lib/onboarding/provider-verification';

describe('resolveProviderVerificationState', () => {
  it('keeps approved ID status when no new ID upload exists', () => {
    const result = resolveProviderVerificationState({
      currentVerificationStatus: 'pending',
      currentIdVerificationStatus: 'approved',
      uploadedIdPath: null,
    });

    expect(result.nextProviderVerificationStatus).toBe('pending');
    expect(result.nextIdVerificationStatus).toBe('approved');
    expect(result.nextIsVerified).toBe(false);
    expect(result.shouldSetIdSubmittedAt).toBe(false);
  });

  it('sets ID status to pending when user uploads a new ID file', () => {
    const result = resolveProviderVerificationState({
      currentVerificationStatus: 'unverified',
      currentIdVerificationStatus: 'none',
      uploadedIdPath: 'id-verifications/user/123-file.pdf',
    });

    expect(result.nextProviderVerificationStatus).toBe('pending');
    expect(result.nextIdVerificationStatus).toBe('pending');
    expect(result.nextIsVerified).toBe(false);
    expect(result.shouldSetIdSubmittedAt).toBe(true);
  });

  it('does not downgrade already verified provider status', () => {
    const result = resolveProviderVerificationState({
      currentVerificationStatus: 'verified',
      currentIdVerificationStatus: 'approved',
      uploadedIdPath: null,
    });

    expect(result.nextProviderVerificationStatus).toBe('verified');
    expect(result.nextIdVerificationStatus).toBe('approved');
    expect(result.nextIsVerified).toBe(true);
  });

  it('falls back safely for unknown status values', () => {
    const result = resolveProviderVerificationState({
      currentVerificationStatus: 'invalid-status',
      currentIdVerificationStatus: 'invalid-id-status',
      uploadedIdPath: null,
    });

    expect(result.nextProviderVerificationStatus).toBe('pending');
    expect(result.nextIdVerificationStatus).toBe('none');
    expect(result.nextIsVerified).toBe(false);
  });
});
