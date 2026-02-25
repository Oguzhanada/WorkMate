export function isValidEnglishFullName(value: string) {
  const normalized = value.trim();
  // Letters + spaces + apostrophe/hyphen, English alphabet only.
  return /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(normalized);
}

export function hasAtLeastTwoNameParts(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts.length >= 2;
}
