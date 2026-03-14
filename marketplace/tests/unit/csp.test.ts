import { describe, expect, it } from 'vitest';

import { buildCspHeader } from '@/lib/security/csp';
import { getCspTierForPath, isStrictCspPath } from '@/lib/security/csp-routes';

describe('CSP route tiering', () => {
  it('keeps marketing routes on the baseline policy', () => {
    expect(getCspTierForPath('/')).toBe('baseline');
    expect(getCspTierForPath('/find-services')).toBe('baseline');
    expect(getCspTierForPath('/profile/public/abc')).toBe('baseline');
  });

  it('marks sensitive surfaces as strict', () => {
    expect(getCspTierForPath('/login')).toBe('strict');
    expect(getCspTierForPath('/dashboard/admin')).toBe('strict');
    expect(getCspTierForPath('/en/checkout/success')).toBe('strict');
    expect(isStrictCspPath('/profile')).toBe(true);
  });
});

describe('CSP policy builder', () => {
  it('builds the baseline policy without strict-dynamic', () => {
    const csp = buildCspHeader({ tier: 'baseline' });

    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'strict-dynamic'");
  });

  it('builds the strict policy with a nonce', () => {
    const csp = buildCspHeader({ tier: 'strict', nonce: 'nonce-value' });

    expect(csp).toContain("script-src 'self' 'nonce-nonce-value' 'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'nonce-nonce-value'");
    expect(csp).not.toContain("'unsafe-inline'");
  });
});
