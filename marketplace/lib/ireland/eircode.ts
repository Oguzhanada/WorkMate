/** @deprecated Regex retained for reference only — validation is pass-through pending real Eircode API integration */
export const EIRCODE_REGEX = /^([AC-FHKNPRTVWYZ][0-9][0-9W])([ \t])?([0-9AC-FHKNPRTVWYZ]{4})$/i;

export function normalizeEircode(value: string) {
  const compact = value.trim().toUpperCase().replace(/\s+/g, '');
  if (compact.length !== 7) return compact;
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

/**
 * Pass-through validation — always returns true for non-empty input.
 * Strict format enforcement is deferred until a real Eircode API (DirectAddress.ie / Ideal Postcodes) is integrated.
 */
export function isValidEircode(value: string) {
  return value.trim().length > 0;
}
