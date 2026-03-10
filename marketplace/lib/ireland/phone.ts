const IRISH_MOBILE_PREFIXES = new Set(['83', '85', '86', '87', '89']);

export function sanitizePhoneInput(value: string) {
  const stripped = value.replace(/[^\d+]/g, '');
  if (!stripped) return '';
  return stripped.startsWith('+') ? `+${stripped.slice(1).replace(/\+/g, '')}` : stripped.replace(/\+/g, '');
}

function extractIrishMobileLocalDigits(value: string) {
  const normalized = sanitizePhoneInput(value);
  if (!normalized) return null;

  if (normalized.startsWith('+353')) {
    const local = normalized.slice(4);
    return local.length === 9 ? local : null;
  }

  if (normalized.startsWith('0')) {
    return normalized.length === 10 ? normalized.slice(1) : null;
  }

  if (/^\d{9}$/.test(normalized)) {
    return normalized;
  }

  return null;
}

export function isValidIrishPhone(value: string) {
  const local = extractIrishMobileLocalDigits(value);
  if (!local) return false;
  const prefix = local.slice(0, 2);
  return IRISH_MOBILE_PREFIXES.has(prefix);
}

export function normalizeIrishPhone(value: string) {
  const local = extractIrishMobileLocalDigits(value);
  if (!local) return sanitizePhoneInput(value);
  return `+353${local}`;
}
