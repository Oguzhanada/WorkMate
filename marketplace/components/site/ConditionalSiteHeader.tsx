'use client';

import {usePathname} from 'next/navigation';

import SiteHeader from '@/components/site/SiteHeader';

function isLocaleHome(pathname: string | null) {
  if (!pathname) return false;
  const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return /^\/[a-z]{2}(?:-[A-Z]{2})?$/.test(normalized);
}

export default function ConditionalSiteHeader() {
  const pathname = usePathname();

  if (isLocaleHome(pathname)) {
    return null;
  }

  return <SiteHeader />;
}
