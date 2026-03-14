import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const key = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
  if (!key) throw new Error('WEBHOOK_SECRET_ENCRYPTION_KEY env var is required');
  // Key must be 32 bytes (64 hex chars)
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-delimited string: `iv:authTag:ciphertext` (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a value previously encrypted by `encrypt()`.
 * Expects the `iv:authTag:ciphertext` format.
 */
export function decrypt(encryptedValue: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, ciphertext] = encryptedValue.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Checks whether a string looks like an encrypted value (iv:authTag:ciphertext format).
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  // iv = 24 hex chars (12 bytes), authTag = 32 hex chars (16 bytes), ciphertext = non-empty
  return parts.length === 3 && parts[0].length === 24 && parts[1].length === 32 && parts[2].length > 0;
}
