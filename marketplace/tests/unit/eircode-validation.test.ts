import {describe, expect, it} from 'vitest';

import {isValidEircode, normalizeEircode} from '@/lib/ireland/eircode';

describe('eircode helpers', () => {
  it('normalizes values to uppercase format with one space', () => {
    expect(normalizeEircode('t12k095')).toBe('T12 K095');
    expect(normalizeEircode('D02H123')).toBe('D02 H123');
  });

  it('accepts valid Irish Eircodes', () => {
    expect(isValidEircode('T12 K095')).toBe(true);
    expect(isValidEircode('D02 H123')).toBe(true);
  });

  it('rejects invalid Eircodes', () => {
    expect(isValidEircode('ABC 1234')).toBe(false);
    expect(isValidEircode('12345')).toBe(false);
  });
});
