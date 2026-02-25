import type {MetadataRoute} from 'next';

import {services} from '@/lib/marketplace-data';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    '',
    '/about',
    '/login',
    '/sign-up',
    '/become-provider',
    '/profile',
    '/search',
    '/jobs',
    '/providers',
    '/contact',
    '/faq',
    '/privacy-policy',
    '/terms',
    '/cookie-policy',
    '/data-retention'
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    entries.push({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: path === '' ? 'daily' : 'weekly',
      priority: path === '' ? 1 : 0.7
    });
  }

  for (const service of services) {
    entries.push({
      url: `${baseUrl}/service/${service.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    });
  }

  return entries;
}

