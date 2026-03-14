import { locales } from '@/i18n/config';

export type CspTier = 'baseline' | 'strict';

const STRICT_PATH_PATTERNS = [
  /^\/login(?:\/|$)/,
  /^\/sign-up(?:\/|$)/,
  /^\/forgot-password(?:\/|$)/,
  /^\/reset-password(?:\/|$)/,
  /^\/dashboard(?:\/|$)/,
  /^\/account(?:\/|$)/,
  /^\/messages(?:\/|$)/,
  /^\/notifications(?:\/|$)/,
  /^\/checkout(?:\/|$)/,
  /^\/profile(?:\/|$)/,
];

const BASELINE_EXCLUSIONS = [/^\/profile\/public(?:\/|$)/];

function normalizePathname(pathname: string) {
  if (!pathname) return '/';

  for (const locale of locales) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || '/';
    }
  }

  return pathname;
}

export function isStrictCspPath(pathname: string) {
  const normalizedPath = normalizePathname(pathname);

  if (BASELINE_EXCLUSIONS.some((pattern) => pattern.test(normalizedPath))) {
    return false;
  }

  return STRICT_PATH_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

export function getCspTierForPath(pathname: string): CspTier {
  return isStrictCspPath(pathname) ? 'strict' : 'baseline';
}
