"use client";

import {useTranslations} from 'next-intl';

import {teamMembers} from '@/lib/marketplace-data';

import styles from '../inner.module.css';

export default function AboutPage() {
  const t = useTranslations('about');

  return (
    <main>
      <section className={styles.section}>
        <div className={styles.container}>
          <h1>{t('title')}</h1>

          <div className={styles.card}>
            <h2>{t('storyTitle')}</h2>
            <p className={styles.muted}>{t('story')}</p>
            <h3>{t('missionTitle')}</h3>
            <p className={styles.muted}>{t('mission')}</p>
            <div className={styles.statBar}>{t('stats')}</div>
          </div>

          <section className={styles.section}>
            <h2>{t('teamTitle')}</h2>
            <div className={styles.teamGrid}>
              {teamMembers.map((member) => (
                <article key={member.name} className={styles.teamCard}>
                  <img src={member.image} alt={member.name} />
                  <div>
                    <h3>{member.name}</h3>
                    <p className={styles.muted}>{member.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2>{t('valuesTitle')}</h2>
            <div className={styles.grid3}>
              <article className={styles.card}>
                <h3>{t('values.transparency')}</h3>
              </article>
              <article className={styles.card}>
                <h3>{t('values.customerFirst')}</h3>
              </article>
              <article className={styles.card}>
                <h3>{t('values.growth')}</h3>
              </article>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
