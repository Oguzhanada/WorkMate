"use client";

import {FormEvent, useState} from 'react';
import {useTranslations} from 'next-intl';

import styles from '../inner.module.css';

type Step = 1 | 2 | 3 | 4;

export default function BecomeProviderPage() {
  const t = useTranslations('becomeProvider');
  const [step, setStep] = useState<Step>(1);
  const [message, setMessage] = useState('');

  const next = () => setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  const back = () => setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setMessage(t('cta'));
  };

  return (
    <main>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.banner}>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
            <h3>{t('benefits.title')}</h3>
            <ul className={styles.benefitList}>
              <li>
                <i className="fa-solid fa-check" /> {t('benefits.setPrices')}
              </li>
              <li>
                <i className="fa-solid fa-check" /> {t('benefits.chooseJobs')}
              </li>
              <li>
                <i className="fa-solid fa-check" /> {t('benefits.securePaid')}
              </li>
              <li>
                <i className="fa-solid fa-check" /> {t('benefits.reviews')}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.formWrap}>
        {message ? <div className={styles.toast}>{message}</div> : null}

        <h2>{t(`steps.${step === 1 ? 'one' : step === 2 ? 'two' : step === 3 ? 'three' : 'four'}`)}</h2>

        <form onSubmit={onSubmit}>
          {step === 1 ? (
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>{t('form.fullName')}</span>
                <input placeholder="Ahmet Yilmaz" />
              </label>
              <label className={styles.field}>
                <span>{t('form.email')}</span>
                <input placeholder="ahmet@example.com" />
              </label>
              <label className={styles.field}>
                <span>{t('form.phone')}</span>
                <input placeholder="+90 555 444 3322" />
              </label>
              <label className={styles.field}>
                <span>{t('form.city')}</span>
                <input placeholder="Istanbul" />
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>{t('form.primaryServices')}</span>
                <input placeholder="Home Cleaning, AC Service" />
              </label>
              <label className={styles.field}>
                <span>{t('form.experience')}</span>
                <input placeholder="5 years" />
              </label>
              <label className={styles.field}>
                <span>{t('form.portfolio')}</span>
                <input placeholder="https://" />
              </label>
              <label className={styles.field}>
                <span>{t('form.availability')}</span>
                <input placeholder="Weekdays 09:00 - 18:00" />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>{t('form.primaryCity')}</span>
                <input placeholder="Dublin" />
              </label>
              <label className={styles.field}>
                <span>{t('form.secondaryAreas')}</span>
                <input placeholder="Cork, Galway" />
              </label>
              <label className={styles.field}>
                <span>{t('form.radius')}</span>
                <input placeholder="Up to 30 km" />
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <div className={styles.field}>
              <span>{t('form.documents')}</span>
              <input placeholder="ID, license, company registration" />
              <p className={styles.muted}>{t('form.bankInfo')}</p>
            </div>
          ) : null}

          <div className={styles.actions}>
            {step > 1 ? (
              <button type="button" className={styles.secondary} onClick={back}>
                {t('back')}
              </button>
            ) : null}

            {step < 4 ? (
              <button type="button" className={styles.primary} onClick={next}>
                {t('next')}
              </button>
            ) : (
              <button type="submit" className={styles.primary}>
                {t('submit')}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
