import type { Metadata } from 'next';
import Link from 'next/link';
import { isValidLocale } from '@/lib/i18n';
import { getTranslations } from 'next-intl/server';
import styles from './how.module.css';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'http://localhost:3000';

const stepVisuals = [
  {
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    badge: '2-3 min',
    tip: 'Your contact details are only shared during matched quote flow.',
  },
  {
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    badge: '3-5 quotes',
    tip: 'Most requests get the first quote within about 30 minutes in business hours.',
  },
  {
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80',
    badge: 'Secure flow',
    tip: 'First-job refund protection and support team coverage increase trust.',
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const home = await getTranslations({ locale, namespace: 'home' });
  const title = home('howTitle');
  const description = home('steps.step1Desc');

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/how-it-works`,
    },
  };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const localePrefix = `/${locale}`;
  const home = await getTranslations({ locale, namespace: 'home' });
  const title = home('howTitle');
  const subtitle = home('heroSubtitle');
  const stepLabel = 'Step';
  const steps = [1, 2, 3].map((no) => ({
    no,
    title: home(`steps.step${no}Title`),
    body: home(`steps.step${no}Desc`),
  }));

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </section>

      <section className={styles.container}>
        {steps.map((step, index) => (
          <article key={step.no} className={`${styles.step} ${index % 2 === 1 ? styles.stepAlt : ''}`}>
            {index % 2 === 1 ? (
              <>
                <div className={styles.visual}>
                  <img src={stepVisuals[index].image} alt={step.title} />
                  <span className={styles.badge}>{stepVisuals[index].badge}</span>
                </div>
                <div className={styles.stepText}>
                  <span className={styles.stepMeta}>{stepLabel} {step.no}</span>
                  <h2>{step.title}</h2>
                  <p>{step.body}</p>
                  <div className={styles.tip}>{stepVisuals[index].tip}</div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.stepText}>
                  <span className={styles.stepMeta}>{stepLabel} {step.no}</span>
                  <h2>{step.title}</h2>
                  <p>{step.body}</p>
                  <div className={styles.tip}>{stepVisuals[index].tip}</div>
                </div>
                <div className={styles.visual}>
                  <img src={stepVisuals[index].image} alt={step.title} />
                  <span className={styles.badge}>{stepVisuals[index].badge}</span>
                </div>
              </>
            )}
          </article>
        ))}
      </section>

      <section className={styles.cta}>
        <h2>Ready to get started?</h2>
        <p>Post a job in minutes or join as a professional and start earning today.</p>
        <div className={styles.ctaActions}>
          <Link href={`${localePrefix}/post-job`} className={styles.ctaPrimary}>
            Post a Job — it&apos;s free
          </Link>
          <Link href={`${localePrefix}/become-provider`} className={styles.ctaSecondary}>
            Become a Provider
          </Link>
        </div>
      </section>
    </main>
  );
}

