import type {Metadata} from 'next';
import Script from 'next/script';
import {getTranslations} from 'next-intl/server';

import {isValidLocale} from '@/lib/i18n';
import {professionals, services} from '@/lib/marketplace-data';

import ServiceDetailClient from './ServiceDetailClient';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'http://localhost:3000';

function getServiceBySlug(slug: string) {
  return services.find((item) => item.slug === slug) ?? services[0];
}

async function getLocalizedServiceName(locale: string, slug: string) {
  const home = await getTranslations({locale, namespace: 'home'});

  if (slug === 'home-cleaning') return home('trend.homeCleaning');
  if (slug === 'painting-decorating') return home('trend.painting');
  if (slug === 'moving-services') return home('trend.moving');
  return home('trend.acRepair');
}

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await params;
  if (!isValidLocale(locale)) return {};

  const seo = await getTranslations({locale, namespace: 'seo'});
  const service = getServiceBySlug(slug);
  const localizedName = await getLocalizedServiceName(locale, service.slug);

  return {
    title: `${localizedName} | ${seo('serviceTitleSuffix')}`,
    description: `${seo('serviceDescriptionPrefix')} ${localizedName}.`,
    alternates: {
      canonical: `${baseUrl}/service/${service.slug}`,
      languages: {
        en: `${baseUrl}/service/${service.slug}`
      }
    }
  };
}

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  if (!isValidLocale(locale)) return null;

  const service = getServiceBySlug(slug);
  const servicePros = professionals.filter((pro) => pro.services.includes(service.slug));

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    areaServed: service.city,
    provider: {
      '@type': 'Organization',
      name: 'WorkMate'
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: Number(service.priceRange.replace(/[^0-9]/g, ' ').trim().split(' ')[0] || '0'),
      highPrice: Number(service.priceRange.replace(/[^0-9]/g, ' ').trim().split(' ')[1] || '0'),
      offerCount: servicePros.length
    }
  };

  const professionalsSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: servicePros.slice(0, 8).map((pro, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'ProfessionalService',
        name: pro.name,
        areaServed: pro.city,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: pro.rating,
          reviewCount: pro.reviews
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          price: Number(pro.startingPrice.replace(/[^0-9]/g, ''))
        }
      }
    }))
  };

  return (
    <>
      <Script id="service-jsonld" type="application/ld+json">
        {JSON.stringify(serviceSchema)}
      </Script>
      <Script id="professionals-jsonld" type="application/ld+json">
        {JSON.stringify(professionalsSchema)}
      </Script>
      <ServiceDetailClient slug={slug} />
    </>
  );
}

