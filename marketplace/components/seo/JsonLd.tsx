/**
 * JSON-LD structured data for SEO.
 * Renders LocalBusiness + WebSite schema on the homepage,
 * and Service schema on service pages.
 */

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';

interface JsonLdProps {
  type: 'homepage' | 'service';
  locale?: string;
  service?: {
    name: string;
    description: string;
    slug: string;
  };
}

function getHomepageSchema(locale: string) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'WorkMate',
      url: baseUrl,
      description:
        'Ireland\'s trusted marketplace connecting homeowners with verified local service professionals.',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/${locale}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'WorkMate',
      url: baseUrl,
      description:
        'Connecting Irish homeowners with trusted local professionals for home services.',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IE',
        addressLocality: 'Dublin',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 53.3498,
        longitude: -6.2603,
      },
      areaServed: {
        '@type': 'Country',
        name: 'Ireland',
      },
      serviceType: [
        'Home Cleaning',
        'Painting & Decorating',
        'Moving Services',
        'AC & Heating',
        'Plumbing',
        'Electrical',
        'Gardening',
        'Carpentry',
      ],
      priceRange: '€€',
      currenciesAccepted: 'EUR',
      paymentAccepted: 'Credit Card, Debit Card',
      sameAs: [],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'WorkMate',
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: 'English',
      },
    },
  ];
}

function getServiceSchema(locale: string, service: { name: string; description: string; slug: string }) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.name,
      description: service.description,
      url: `${baseUrl}/${locale}/service/${service.slug}`,
      provider: {
        '@type': 'Organization',
        name: 'WorkMate',
        url: baseUrl,
      },
      areaServed: {
        '@type': 'Country',
        name: 'Ireland',
      },
      serviceType: service.name,
    },
  ];
}

export default function JsonLd({ type, locale = 'en', service }: JsonLdProps) {
  const schemas =
    type === 'homepage'
      ? getHomepageSchema(locale)
      : service
        ? getServiceSchema(locale, service)
        : [];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
