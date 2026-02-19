export const EIRCODE_REGEX = /^[AC-FHKNPRTV-Y][0-9]{2}\s?[AC-FHKNPRTV-Y0-9]{4}$/i;

export function normalizeEircode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/, ' ');
}

export function isValidEircode(value: string) {
  return EIRCODE_REGEX.test(normalizeEircode(value));
}
