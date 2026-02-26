"use client";

import Link from 'next/link';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {FormEvent, useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';

import {professionals, services} from '@/lib/marketplace-data';
import VerifiedNavigationLink from '@/components/site/VerifiedNavigationLink';
import {COUNTY_CITIES} from '@/lib/ireland-locations';

import styles from '../inner.module.css';
import pageStyles from './search-page.module.css';

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('search');
  const common = useTranslations('common');
  const home = useTranslations('home');
  const params = useSearchParams();
  const initialQuery = (params.get('q') ?? '').trim();
  const countyParam = (params.get('county') ?? '').trim();
  const modeParam = (params.get('mode') ?? 'services').trim().toLowerCase();
  const query = initialQuery.toLowerCase();
  const initialMode = modeParam === 'providers' ? 'providers' : 'services';
  const [keyword, setKeyword] = useState(initialQuery);
  const [cityFilter, setCityFilter] = useState(countyParam);
  const [mode, setMode] = useState<'services' | 'providers'>(initialMode);
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState('');

  useEffect(() => {
    setKeyword((params.get('q') ?? '').trim());
    setCityFilter((params.get('county') ?? '').trim());
    const nextMode = (params.get('mode') ?? 'services').trim().toLowerCase();
    setMode(nextMode === 'providers' ? 'providers' : 'services');
  }, [params]);

  const allCities = useMemo(() => {
    const values = new Set<string>();
    Object.values(COUNTY_CITIES).forEach((cities) => {
      cities.forEach((city) => values.add(city));
    });
    ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Wexford', 'Sligo', 'Athlone'].forEach((city) =>
      values.add(city)
    );
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
    if (slug === 'home-cleaning') return home('trend.homeCleaning');
    if (slug === 'painting-decorating') return home('trend.painting');
    if (slug === 'moving-services') return home('trend.moving');
    return home('trend.acRepair');
  };

  const onKeywordSearch = (event: FormEvent) => {
    event.preventDefault();
    const nextParams = new URLSearchParams(params.toString());
    const trimmed = keyword.trim();
    if (trimmed) nextParams.set('q', trimmed);
    else nextParams.delete('q');
    if (cityFilter) nextParams.set('county', cityFilter);
    else nextParams.delete('county');
    nextParams.set('mode', mode);
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  const onModeChange = (nextMode: 'services' | 'providers') => {
    setMode(nextMode);
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set('mode', nextMode);
    if (keyword.trim()) nextParams.set('q', keyword.trim());
    else nextParams.delete('q');
    if (cityFilter) nextParams.set('county', cityFilter);
    else nextParams.delete('county');
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <h1>{t('title')}</h1>
        <p className={pageStyles.subtitle}>
          {t('subtitle')} <strong>{query || '-'}</strong>
        </p>
        <section className={pageStyles.modeToggle}>
          <button
            type="button"
            onClick={() => onModeChange('services')}
            className={`${pageStyles.modeButton} ${mode === 'services' ? pageStyles.modeButtonActive : ''}`}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => onModeChange('providers')}
            className={`${pageStyles.modeButton} ${mode === 'providers' ? pageStyles.modeButtonActive : ''}`}
          >
            Providers
          </button>
        </section>
        <section className={`${styles.card} ${pageStyles.cardShell}`}>
          <form onSubmit={onKeywordSearch} className={pageStyles.searchRow}>
            <label className={pageStyles.field}>
              <span>Keyword</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search service or provider"
              />
            </label>
            <label className={pageStyles.field}>
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
            <div className={pageStyles.searchActions}>
              <button type="submit" className={`${styles.primary} ${pageStyles.searchButton}`}>
                Find Service
              </button>
            </div>
          </form>
        </section>
        <section className={`${styles.card} ${pageStyles.cardShell}`}>
          <h3>{t('filtersTitle')}</h3>
          <div className={pageStyles.filterGrid}>
            <label className={pageStyles.field}>
              <span>{t('maxPrice')}</span>
              <select value={maxPriceFilter} onChange={(event) => setMaxPriceFilter(event.target.value)}>
                <option value="">{t('allPrices')}</option>
                <option value="100">EUR100</option>
                <option value="200">EUR200</option>
                <option value="400">EUR400</option>
                <option value="1000">EUR1000</option>
              </select>
            </label>
            <label className={pageStyles.field}>
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
            className={`${styles.secondary} ${pageStyles.clearButton}`}
            onClick={() => {
              setMaxPriceFilter('');
              setMinRatingFilter('');
            }}
          >
            {t('clear')}
          </button>
        </section>

        {!matchedServices.length && !matchedPros.length ? (
          <div className={`${styles.card} ${pageStyles.emptyState}`}>{t('noResults')}</div>
        ) : (
          <div className={pageStyles.resultsWrap}>
            <section>
              <h2 className={pageStyles.sectionTitle}>
                {mode === 'services' ? 'Matching services' : 'Matching providers'}
              </h2>
              <div className={pageStyles.resultsGrid}>
                {mode === 'services'
                  ? matchedServices.map((service) => (
                      <article className={pageStyles.resultCard} key={service.slug}>
                        <img src={service.heroImage} alt={localizedServiceName(service.slug)} />
                        <div className={pageStyles.cardBody}>
                          <h3>{localizedServiceName(service.slug)}</h3>
                          <p className={pageStyles.meta}>{service.city}</p>
                          <Link className={`${styles.primary} ${pageStyles.cardAction}`} href={`/service/${service.slug}`}>
                            {common('viewDetails')}
                          </Link>
                        </div>
                      </article>
                    ))
                  : matchedPros.map((pro) => (
                      <article className={pageStyles.resultCard} key={pro.id}>
                        <img src={pro.image} alt={pro.name} />
                        <div className={pageStyles.cardBody}>
                          <h3>{pro.name}</h3>
                          <p className={pageStyles.meta}>
                            {pro.city} • {pro.rating.toFixed(1)} ({pro.reviews} {common('reviews')})
                          </p>
                          <p className={pageStyles.meta}>
                            {common('from')} {pro.startingPrice}
                          </p>
                          <VerifiedNavigationLink
                            className={`${styles.primary} ${pageStyles.cardAction}`}
                            href={`/post-job?pro=${encodeURIComponent(pro.id)}`}
                          >
                            {common('requestQuote')}
                          </VerifiedNavigationLink>
                        </div>
                      </article>
                    ))}
              </div>
            </section>
            <section>
              <h3 className={pageStyles.secondaryTitle}>
                {mode === 'services' ? 'Related providers' : 'Related services'}
              </h3>
              <div className={pageStyles.resultsGrid}>
                {mode === 'services'
                  ? matchedPros.slice(0, 6).map((pro) => (
                      <article className={pageStyles.resultCard} key={pro.id}>
                        <img src={pro.image} alt={pro.name} />
                        <div className={pageStyles.cardBody}>
                          <h3>{pro.name}</h3>
                          <p className={pageStyles.meta}>
                            {pro.city} • {pro.rating.toFixed(1)} ({pro.reviews} {common('reviews')})
                          </p>
                          <p className={pageStyles.meta}>
                            {common('from')} {pro.startingPrice}
                          </p>
                          <VerifiedNavigationLink
                            className={`${styles.secondary} ${pageStyles.cardAction}`}
                            href={`/post-job?pro=${encodeURIComponent(pro.id)}`}
                          >
                            {common('requestQuote')}
                          </VerifiedNavigationLink>
                        </div>
                      </article>
                    ))
                  : matchedServices.slice(0, 6).map((service) => (
                      <article className={pageStyles.resultCard} key={service.slug}>
                        <img src={service.heroImage} alt={localizedServiceName(service.slug)} />
                        <div className={pageStyles.cardBody}>
                          <h3>{localizedServiceName(service.slug)}</h3>
                          <p className={pageStyles.meta}>{service.city}</p>
                          <Link className={`${styles.secondary} ${pageStyles.cardAction}`} href={`/service/${service.slug}`}>
                            {common('viewDetails')}
                          </Link>
                        </div>
                      </article>
                    ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

