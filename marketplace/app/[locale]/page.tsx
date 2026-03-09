import type {Metadata} from 'next';
import dynamic from 'next/dynamic';
import {getTranslations} from 'next-intl/server';
import {Suspense} from 'react';

import CategoriesSection from '@/components/home/CategoriesSection';
import CTASection from '@/components/home/CTASection';
import HeroSection from '@/components/home/HeroSection';
import HomeSkeleton from '@/components/home/HomeSkeleton';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import TrustSection from '@/components/home/TrustSection';
import StatsSection from '@/components/home/StatsSection';
import WhyWorkMate from '@/components/home/WhyWorkMate';
import QuickStartHighlights from '@/components/home/QuickStartHighlights';
import JsonLd from '@/components/seo/JsonLd';
import {isValidLocale} from '@/lib/i18n';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'http://localhost:3000';
const FeaturedProviders = dynamic(() => import('@/components/home/FeaturedProviders'), {
  loading: () => <HomeSkeleton />
});

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  if (!isValidLocale(locale)) return {};

  const seo = await getTranslations({locale, namespace: 'seo'});

  return {
    title: seo('homeTitle'),
    description: seo('homeDescription'),
    alternates: {
      canonical: `${baseUrl}`
    }
  };
}

export default async function LocaleHomePage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!isValidLocale(locale)) return null;

  return (
    <main className="min-h-screen text-[var(--wm-text)]">
      <JsonLd type="homepage" locale={locale} />
      <Suspense fallback={<HomeSkeleton />}>
        <HeroSection />
        <TrustSection />
        <StatsSection />
        <CategoriesSection />
        <QuickStartHighlights />
        <HowItWorks />
        <FeaturedProviders />
        <WhyWorkMate />
        <Testimonials />
        <CTASection />
      </Suspense>
    </main>
  );
}
