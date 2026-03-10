import {describe, expect, it} from 'vitest';

import {isValidIrishPhone, normalizeIrishPhone, sanitizePhoneInput} from '@/lib/ireland/phone';

describe('phone validation helpers', () => {
  it('sanitizes spaces and non-digit symbols while keeping +', () => {
    expect(sanitizePhoneInput('+353 83 044 6082')).toBe('+353830446082');
    expect(sanitizePhoneInput('0830-446-082')).toBe('0830446082');
  });

  it('validates supported formats', () => {
    expect(isValidIrishPhone('830446082')).toBe(true);
    expect(isValidIrishPhone('0830446082')).toBe(true);
    expect(isValidIrishPhone('+353830446082')).toBe(true);
  });

  it('rejects unsupported phone numbers', () => {
    expect(isValidIrishPhone('+353658245785')).toBe(false);
    expect(isValidIrishPhone('12345')).toBe(false);
  });

  it('normalizes accepted inputs to +353 format', () => {
    expect(normalizeIrishPhone('+353830446082')).toBe('+353830446082');
    expect(normalizeIrishPhone('0830446082')).toBe('+353830446082');
    expect(normalizeIrishPhone('830446082')).toBe('+353830446082');
  });
});
