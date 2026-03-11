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

/** Returns true if the value is a valid UK mobile number (+44 7xxx xxxxxxx) */
function isUkMobile(normalized: string): boolean {
  // +447xxxxxxxxx — 13 chars total, 10 digits after +44
  if (normalized.startsWith('+44')) {
    const local = normalized.slice(3);
    return /^7\d{9}$/.test(local);
  }
  return false;
}

/**
 * Validates Irish (+353) or UK mobile (+44 7xxx) numbers.
 * Accepts users living in Ireland who retain a UK SIM.
 */
export function isValidIrishPhone(value: string) {
  const normalized = sanitizePhoneInput(value);
  if (isUkMobile(normalized)) return true;
  const local = extractIrishMobileLocalDigits(value);
  if (!local) return false;
  const prefix = local.slice(0, 2);
  return IRISH_MOBILE_PREFIXES.has(prefix);
}

/** Normalizes to E.164 format (+353... or +44...) */
export function normalizeIrishPhone(value: string) {
  const normalized = sanitizePhoneInput(value);
  if (isUkMobile(normalized)) return normalized;
  const local = extractIrishMobileLocalDigits(value);
  if (!local) return normalized;
  return `+353${local}`;
}
