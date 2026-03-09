import type { Metadata } from 'next';
import Link from 'next/link';
import { isValidLocale } from '@/lib/i18n';
import Button from '@/components/ui/Button';
import styles from './other.module.css';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'http://localhost:3000';

const catalog = {
  title: 'More Services',
  searchPlaceholder: 'What service are you looking for?',
  searchButton: 'Search',
  sections: [
    {
      title: 'Auto and Vehicle',
      items: ['NCT Prep', 'Tyre Change', 'Auto Electric', 'Body Paint', 'Car Detailing', 'Window Tint', 'Oil Change', 'Body Repair', 'Battery Replacement'],
    },
    {
      title: 'Photo and Video',
      items: ['Wedding Photographer', 'Brand Video', 'Drone Filming', 'E-commerce Product Shoot', 'Social Media Shoot', 'Video Editing', 'Event Photographer', 'Podcast Recording', 'Venue Shoot'],
    },
    {
      title: 'Health and Wellbeing',
      items: ['Online Therapy', 'Clinical Psychologist', 'Dietitian', 'Pilates Class', 'Yoga Class', 'Personal Trainer', 'Physiotherapist', 'Child Psychologist', 'Occupational Therapy'],
    },
    {
      title: 'Pets',
      items: ['Dog Walking', 'Cat Sitting', 'Pet Grooming', 'Dog Training', 'Vet Visit Assistance', 'Pet Hotel', 'In-home Pet Care', 'Cat Grooming', 'Dog Grooming'],
    },
    {
      title: 'Digital and Business',
      items: ['Website Setup', 'SEO Service', 'Google Ads Management', 'Social Media Management', 'Graphic Design', 'Logo Design', 'CV Writing', 'Online Bookkeeping Help', 'Translation'],
    },
    {
      title: 'Local and Daily',
      items: ['Home Helper', 'Elderly Care', 'Childcare', 'Pre-move Cleaning', 'Garden Care', 'Lawn Mowing', 'Gutter Cleaning', 'Small Repairs', 'Lock Replacement'],
    },
  ],
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  return {
    title: 'More Services | WorkMate',
    description: 'A broad catalog of services tailored to everyday needs.',
    alternates: {
      canonical: `${baseUrl}/other-services`,
    },
  };
}

export default async function OtherServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const data = catalog;

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1>{data.title}</h1>
          <form className={styles.searchBar} action={`/search`}>
            <input name="q" type="text" placeholder={data.searchPlaceholder} />
            <Button type="submit" variant="primary" size="sm">{data.searchButton}</Button>
          </form>
        </div>
      </section>

      <section className={styles.container}>
        {data.sections.map((section) => (
          <article key={section.title} className={styles.category}>
            <h2>{section.title}</h2>
            <div className={styles.listGrid}>
              {section.items.map((item) => (
                <Link
                  key={`${section.title}-${item}`}
                  href={`/search?q=${encodeURIComponent(item)}`}
                  className={styles.itemLink}
                >
                  {item}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

