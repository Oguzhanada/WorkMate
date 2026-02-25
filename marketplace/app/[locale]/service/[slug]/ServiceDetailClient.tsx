"use client";

import Link from 'next/link';
import {useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';

import {professionals, services} from '@/lib/marketplace-data';
import VerifiedNavigationLink from '@/components/site/VerifiedNavigationLink';

import styles from '../../inner.module.css';

export default function ServiceDetailClient({slug}: {slug: string}) {
  const locale = useLocale();
  const t = useTranslations('serviceDetail');
  const common = useTranslations('common');
  const home = useTranslations('home');

  const service = services.find((item) => item.slug === slug) ?? services[0];
  const serviceName =
    service.slug === 'home-cleaning'
      ? home('trend.homeCleaning')
      : service.slug === 'painting-decorating'
        ? home('trend.painting')
        : service.slug === 'moving-services'
          ? home('trend.moving')
          : home('trend.acRepair');

  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [rating, setRating] = useState('4.8');

  const filteredPros = useMemo(
    () =>
      professionals
        .filter((pro) => pro.services.includes(service.slug))
        .filter((pro) => (city ? pro.city.toLowerCase().includes(city.toLowerCase()) : true))
        .filter((pro) => (rating ? pro.rating >= Number(rating) : true))
        .filter((pro) =>
          price ? Number(pro.startingPrice.replace(/[^0-9]/g, '')) <= Number(price) : true
        ),
    [city, price, rating, service.slug]
  );

  return (
    <main>
      <section className={styles.serviceHero} style={{backgroundImage: `url(${service.heroImage})`}}>
        <div className={styles.container}>
          <h1>{serviceName}</h1>
          <p>
            {t('startingFrom')}: <strong>{service.priceRange}</strong>
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <article className={styles.card}>
            <h2>{serviceName}</h2>
            <p className={styles.muted}>{t('description1')}</p>
            <p className={styles.muted}>{t('description2')}</p>
            <p className={styles.muted}>{t('description3')}</p>
          </article>

          <article className={styles.card}>
            <h3>{t('filtersTitle')}</h3>
            <div className={styles.filterRow}>
              <label className={styles.field}>
                <span>{common('city')}</span>
                <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Dublin" />
              </label>
              <label className={styles.field}>
                <span>{common('price')} (EUR)</span>
                <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="150" />
              </label>
              <label className={styles.field}>
                <span>{common('rating')}</span>
                <select value={rating} onChange={(event) => setRating(event.target.value)}>
                  <option value="4.8">4.8+</option>
                  <option value="4.9">4.9+</option>
                </select>
              </label>
            </div>
          </article>

          <section className={styles.section}>
            <div className={styles.proList}>
              {filteredPros.slice(0, 8).map((pro) => (
                <article className={styles.proCard} key={pro.id}>
                  <img src={pro.image} alt={pro.name} />
                  <div>
                    <h3>{pro.name}</h3>
                    <p className={styles.muted}>
                      {pro.city} • {pro.rating.toFixed(1)} ({pro.reviews} {common('reviews')})
                    </p>
                    <p className={styles.muted}>
                      {common('from')} {pro.startingPrice}
                    </p>
                    <VerifiedNavigationLink
                      className={styles.primary}
                      href={`/post-job?service=${encodeURIComponent(service.slug)}&pro=${encodeURIComponent(pro.id)}`}
                    >
                      {common('requestQuote')}
                    </VerifiedNavigationLink>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.faq}>
            <h2>{t('faqTitle')}</h2>
            <details>
              <summary>{t('faq1q')}</summary>
              <p className={styles.muted}>{t('faq1a')}</p>
            </details>
            <details>
              <summary>{t('faq2q')}</summary>
              <p className={styles.muted}>{t('faq2a')}</p>
            </details>
            <details>
              <summary>{t('faq3q')}</summary>
              <p className={styles.muted}>{t('faq3a')}</p>
            </details>
          </section>
        </div>
      </section>
    </main>
  );
}
