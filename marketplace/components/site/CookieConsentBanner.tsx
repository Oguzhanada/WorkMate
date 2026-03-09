"use client";

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';

import styles from './site.module.css';

const COOKIE_KEY = 'cookie_consent';

type ConsentValue = 'accepted' | 'rejected';

export default function CookieConsentBanner() {
  const t = useTranslations('consent');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const hasConsent = document.cookie
        .split(';')
        .map((entry) => entry.trim())
        .some((entry) => entry.startsWith(`${COOKIE_KEY}=`));

      setIsVisible(!hasConsent);
    });
  }, []);

  const setConsent = (value: ConsentValue) => {
    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_KEY}=${value}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secureFlag}`;
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <section className={styles.consentBar} aria-live="polite">
      <div className={styles.container}>
        <div className={styles.consentInner}>
          <div>
            <h4>{t('title')}</h4>
            <p>{t('description')}</p>
          </div>
          <div className={styles.consentActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setConsent('rejected')}>
              {t('reject')}
            </button>
            <button type="button" className={styles.primaryButton} onClick={() => setConsent('accepted')}>
              {t('accept')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
