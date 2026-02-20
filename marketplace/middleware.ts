import createMiddleware from 'next-intl/middleware';

import {defaultLocale, locales} from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export const config = {
  matcher: ['/', '/about', '/giris', '/uye-ol', '/hizmet-ver', '/hizmet/:path*', '/arama', '/privacy-policy', '/terms', '/cookie-policy', '/(en|tr|pt|es)/:path*']
};
