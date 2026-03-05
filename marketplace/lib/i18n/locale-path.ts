export function getLocaleRoot(pathname: string) {
  const match = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(?:\/|$)/);
  if (!match?.[1]) return '/';
  return `/${match[1]}`;
}

export function withLocalePrefix(localeRoot: string, path: string) {
  if (!path) return localeRoot;
  if (/^[a-z]+:\/\//i.test(path) || path.startsWith('//')) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (localeRoot === '/') return normalizedPath;
  if (normalizedPath === localeRoot || normalizedPath.startsWith(`${localeRoot}/`)) {
    return normalizedPath;
  }

  return `${localeRoot}${normalizedPath}`;
}
