"use client";

import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useMemo, useState} from 'react';
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
  const [cityFilter, setCityFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState('');

  const allCities = useMemo(() => {
    const values = new Set<string>();
    services.forEach((service) => values.add(service.city));
    professionals.forEach((pro) => values.add(pro.city));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, []);

  const matchedServices = useMemo(
    () =>
      services
        .filter(
          (service) =>
            service.name.toLowerCase().includes(query) ||
            service.category.toLowerCase().includes(query) ||
            service.summary.toLowerCase().includes(query)
        )
        .filter((service) => (cityFilter ? service.city === cityFilter : true))
        .filter((service) => {
          if (!maxPriceFilter) return true;
          const highPrice = Number(service.priceRange.replace(/[^0-9]/g, ' ').trim().split(' ')[1] || 0);
          return highPrice <= Number(maxPriceFilter);
        })
        .filter((service) => {
          if (!minRatingFilter) return true;
          const servicePros = professionals.filter((pro) => pro.services.includes(service.slug));
          if (!servicePros.length) return false;
          const avg = servicePros.reduce((sum, pro) => sum + pro.rating, 0) / servicePros.length;
          return avg >= Number(minRatingFilter);
        }),
    [cityFilter, maxPriceFilter, minRatingFilter, query]
  );

  const matchedPros = useMemo(
    () =>
      professionals
        .filter(
          (pro) =>
            pro.name.toLowerCase().includes(query) ||
            pro.city.toLowerCase().includes(query) ||
            pro.services.some((service) => service.includes(query.replace(/\s+/g, '-')))
        )
        .filter((pro) => (cityFilter ? pro.city === cityFilter : true))
        .filter((pro) => {
          if (!maxPriceFilter) return true;
          return Number(pro.startingPrice.replace(/[^0-9]/g, '')) <= Number(maxPriceFilter);
        })
        .filter((pro) => (minRatingFilter ? pro.rating >= Number(minRatingFilter) : true)),
    [cityFilter, maxPriceFilter, minRatingFilter, query]
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
        <section className={styles.card}>
          <h3>{t('filtersTitle')}</h3>
          <div className={styles.filterRow}>
            <label className={styles.field}>
              <span>{common('city')}</span>
              <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
                <option value="">{t('allCities')}</option>
                {allCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>{t('maxPrice')}</span>
              <select value={maxPriceFilter} onChange={(event) => setMaxPriceFilter(event.target.value)}>
                <option value="">{t('allPrices')}</option>
                <option value="100">EUR100</option>
                <option value="200">EUR200</option>
                <option value="400">EUR400</option>
                <option value="1000">EUR1000</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>{t('minRating')}</span>
              <select value={minRatingFilter} onChange={(event) => setMinRatingFilter(event.target.value)}>
                <option value="">{t('allRatings')}</option>
                <option value="4.5">4.5+</option>
                <option value="4.7">4.7+</option>
                <option value="4.8">4.8+</option>
                <option value="4.9">4.9+</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setCityFilter('');
              setMaxPriceFilter('');
              setMinRatingFilter('');
            }}
          >
            {t('clear')}
          </button>
        </section>

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
                  <Link className={styles.primary} href={`/${locale}/post-job?pro=${encodeURIComponent(pro.id)}`}>
                    {common('requestQuote')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
