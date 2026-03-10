export const EIRCODE_REGEX = /^([AC-FHKNPRTVWYZ][0-9][0-9W])([ \t])?([0-9AC-FHKNPRTVWYZ]{4})$/i;

export function normalizeEircode(value: string) {
  const compact = value.trim().toUpperCase().replace(/\s+/g, '');
  if (compact.length !== 7) return compact;
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

export function isValidEircode(value: string) {
  return EIRCODE_REGEX.test(normalizeEircode(value));
}
