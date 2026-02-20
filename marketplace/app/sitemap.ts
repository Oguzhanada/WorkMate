import type {MetadataRoute} from 'next';

import {locales} from '@/i18n/config';
import {services} from '@/lib/marketplace-data';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    '',
    '/about',
    '/giris',
    '/uye-ol',
    '/hizmet-ver',
    '/arama',
    '/iletisim',
    '/sss',
    '/privacy-policy',
    '/terms',
    '/cookie-policy',
    '/data-retention'
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? 1 : 0.7
      });
    }

    for (const service of services) {
      entries.push({
        url: `${baseUrl}/${locale}/hizmet/${service.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8
      });
    }
  }

  return entries;
}
