export function normalizeEircode(value: string) {
  const compact = value.trim().toUpperCase().replace(/\s+/g, '');
  if (compact.length !== 7) return compact;
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}
