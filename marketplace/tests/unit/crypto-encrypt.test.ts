import { describe, it, expect } from 'vitest';
import { randomBytes } from 'crypto';

// Set test encryption key before importing the module
process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = randomBytes(32).toString('hex');

import { encrypt, decrypt, isEncrypted } from '@/lib/crypto/encrypt';

describe('lib/crypto/encrypt — AES-256-GCM', () => {
  it('encrypt/decrypt roundtrip preserves plaintext', () => {
    const secret = randomBytes(32).toString('hex');
    const encrypted = encrypt(secret);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(secret);
  });

  it('encrypted output has iv:authTag:ciphertext format', () => {
    const encrypted = encrypt('test-secret');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24); // 12-byte IV = 24 hex
    expect(parts[1]).toHaveLength(32); // 16-byte authTag = 32 hex
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('isEncrypted returns true for encrypted values', () => {
    const encrypted = encrypt('hello');
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('isEncrypted returns false for plaintext', () => {
    expect(isEncrypted('just-a-plain-secret')).toBe(false);
    expect(isEncrypted('')).toBe(false);
  });

  it('each encryption produces a unique IV (no IV reuse)', () => {
    const a = encrypt('same-input');
    const b = encrypt('same-input');
    expect(a).not.toBe(b); // different IV each time
    expect(decrypt(a)).toBe(decrypt(b)); // but same plaintext
  });

  it('tampered ciphertext fails decryption', () => {
    const encrypted = encrypt('secret');
    const [iv, authTag, ciphertext] = encrypted.split(':');
    const tampered = `${iv}:${authTag}:${'ff'.repeat(ciphertext.length / 2)}`;
    expect(() => decrypt(tampered)).toThrow();
  });
});
