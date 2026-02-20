"use client";

import {useTranslations} from 'next-intl';

import styles from './inner.module.css';

export default function LocaleError({reset}: {reset: () => void}) {
  const common = useTranslations('common');

  return (
    <main className={styles.formWrap}>
      <h1>Unexpected error</h1>
      <p className={styles.muted}>This page could not be loaded. Please retry.</p>
      <button type="button" className={styles.primary} onClick={() => reset()}>
        {common('submit')}
      </button>
    </main>
  );
}
