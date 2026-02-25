export function sanitizePhoneInput(value: string) {
  const stripped = value.replace(/[^\d+]/g, '');
  if (!stripped) return '';
  return stripped.startsWith('+') ? `+${stripped.slice(1).replace(/\+/g, '')}` : stripped.replace(/\+/g, '');
}

export function isValidIrishPhone(value: string) {
  const normalized = sanitizePhoneInput(value);
  if (!normalized) return false;

  if (!/^\+?\d+$/.test(normalized)) return false;

  if (normalized.startsWith('+353')) {
    const local = normalized.slice(4);
    return local.length >= 8 && local.length <= 10;
  }

  if (normalized.startsWith('0')) {
    return normalized.length >= 9 && normalized.length <= 10;
  }

  return false;
}
