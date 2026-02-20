"use client";

import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';

import {services} from '@/lib/marketplace-data';

import styles from './home.module.css';

const valueItems = [
  {icon: 'fa-star', title: 'qualityTitle', description: 'qualityDesc'},
  {icon: 'fa-clock', title: 'timeTitle', description: 'timeDesc'},
  {icon: 'fa-shield-halved', title: 'guaranteeTitle', description: 'guaranteeDesc'},
  {icon: 'fa-mobile-screen-button', title: 'easyTitle', description: 'easyDesc'}
] as const;

const stepImages = [
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80'
];

export default function LocaleHomePage() {
  const locale = useLocale();
  const t = useTranslations('home');
  const common = useTranslations('common');

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <h1>{t('heroTitle')}</h1>
            <p>{t('heroSubtitle')}</p>
            <form className={styles.searchBar} action={`/${locale}/arama`}>
              <input name="q" type="text" placeholder={common('searchPlaceholder')} />
              <button type="submit">{t('searchButton')}</button>
            </form>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('trendTitle')}</h2>
          <div className={styles.trendGrid}>
            {services.map((service) => (
              <article className={styles.trendCard} key={service.slug}>
                <img src={service.heroImage} alt={service.name} />
                <div className={styles.trendBody}>
                  <h3>{t(`trend.${service.slug === 'ev-temizligi' ? 'homeCleaning' : service.slug === 'boya-badana' ? 'painting' : service.slug === 'nakliyat' ? 'moving' : 'acRepair'}`)}</h3>
                  <p>{service.city}</p>
                  <p>{service.priceRange}</p>
                  <Link href={`/${locale}/hizmet/${service.slug}`}>{common('requestQuote')}</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.valuesSection}`}>
        <div className={styles.container}>
          <div className={styles.valueGrid}>
            {valueItems.map((item) => (
              <article key={item.title} className={styles.valueCard}>
                <i className={`fa-solid ${item.icon}`} />
                <h3>{t(`values.${item.title}`)}</h3>
                <p>{t(`values.${item.description}`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="how-it-works">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('howTitle')}</h2>
          <div className={styles.stepList}>
            {[1, 2, 3].map((step) => (
              <article key={step} className={styles.stepCard}>
                <div className={styles.stepBadge}>{step}</div>
                <div className={styles.stepText}>
                  <h3>{t(`steps.step${step}Title`)}</h3>
                  <p>{t(`steps.step${step}Desc`)}</p>
                </div>
                <img src={stepImages[step - 1]} alt={t(`steps.step${step}Title`)} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.providerBanner}>
            <div className={styles.providerVisual}>
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80"
                alt={t('proBannerTitle')}
              />
            </div>
            <div className={styles.providerContent}>
              <h2>{t('proBannerTitle')}</h2>
              <p>{t('proBannerDesc')}</p>
              <Link href={`/${locale}/hizmet-ver`} className={styles.providerButton}>
                {t('proBannerCta')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
