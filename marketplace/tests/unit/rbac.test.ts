import {describe, expect, it} from 'vitest';

import {canAccessAdmin, canPostJobWithIdentity, canQuoteJob} from '@/lib/auth/rbac';

describe('rbac identity gates', () => {
  it('allows customers to post jobs without approved identity in progressive mode', () => {
    expect(canPostJobWithIdentity(['customer'], 'none')).toBe(true);
    expect(canPostJobWithIdentity(['customer'], 'approved')).toBe(true);
  });

  it('allows providers to quote only when provider role exists', () => {
    expect(canQuoteJob(['verified_pro'], 'none')).toBe(true);
    expect(canQuoteJob(['customer'], 'approved')).toBe(false);
  });

  it('enforces admin-only admin panel access', () => {
    expect(canAccessAdmin(['admin'])).toBe(true);
    expect(canAccessAdmin(['customer'])).toBe(false);
  });
});
