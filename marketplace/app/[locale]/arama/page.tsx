"use client";

import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';

import {professionals, services} from '@/lib/marketplace-data';

import styles from '../inner.module.css';

export default function SearchPage() {
  const locale = useLocale();
  const t = useTranslations('search');
  const common = useTranslations('common');
  const home = useTranslations('home');
  const params = useSearchParams();
  const query = (params.get('q') ?? '').trim().toLowerCase();

  const matchedServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(query) ||
      service.category.toLowerCase().includes(query) ||
      service.summary.toLowerCase().includes(query)
  );

  const matchedPros = professionals.filter(
    (pro) =>
      pro.name.toLowerCase().includes(query) ||
      pro.city.toLowerCase().includes(query) ||
      pro.services.some((service) => service.includes(query.replace(/\s+/g, '-')))
  );

  const localizedServiceName = (slug: string) => {
    if (slug === 'ev-temizligi') return home('trend.homeCleaning');
    if (slug === 'boya-badana') return home('trend.painting');
    if (slug === 'nakliyat') return home('trend.moving');
    return home('trend.acRepair');
  };

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <h1>{t('title')}</h1>
        <p className={styles.muted}>
          {t('subtitle')} <strong>{query || '-'}</strong>
        </p>

        {!matchedServices.length && !matchedPros.length ? (
          <div className={styles.card}>{t('noResults')}</div>
        ) : (
          <div className={styles.resultsGrid}>
            {matchedServices.map((service) => (
              <article className={styles.resultCard} key={service.slug}>
                <img src={service.heroImage} alt={localizedServiceName(service.slug)} />
                <div>
                  <h3>{localizedServiceName(service.slug)}</h3>
                  <p className={styles.muted}>{service.city}</p>
                  <Link className={styles.primary} href={`/${locale}/hizmet/${service.slug}`}>
                    {common('viewDetails')}
                  </Link>
                </div>
              </article>
            ))}

            {matchedPros.map((pro) => (
              <article className={styles.resultCard} key={pro.id}>
                <img src={pro.image} alt={pro.name} />
                <div>
                  <h3>{pro.name}</h3>
                  <p className={styles.muted}>
                    {pro.city} • {pro.rating.toFixed(1)} ({pro.reviews} {common('reviews')})
                  </p>
                  <p className={styles.muted}>
                    {common('from')} {pro.startingPrice}
                  </p>
                  <button className={styles.primary} type="button">
                    {common('requestQuote')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
