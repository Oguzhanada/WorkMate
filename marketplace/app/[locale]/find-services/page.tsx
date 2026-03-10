import type { Metadata } from 'next';
import FindServicesClient from './FindServicesClient';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = 'Find Services Near You | WorkMate';
  const description =
    'Explore verified service providers across Ireland on an interactive map. Filter by category, county, rating, and more.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'WorkMate',
      url: `${baseUrl}/${locale}/find-services`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/find-services`,
    },
  };
}

export default async function FindServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  // Extract initial filter values from URL search params — pure parsing, no server fetches
  const initialFilters = {
    q: typeof sp.q === 'string' ? sp.q : '',
    county: typeof sp.county === 'string' ? sp.county : 'Any',
    sort: typeof sp.sort === 'string' ? sp.sort : 'relevance',
    verified_only: sp.verified_only === 'true',
    garda_vetted: sp.garda_vetted === 'true',
    budget: typeof sp.budget === 'string' ? sp.budget : '',
  };

  return <FindServicesClient locale={locale} initialFilters={initialFilters} />;
}
