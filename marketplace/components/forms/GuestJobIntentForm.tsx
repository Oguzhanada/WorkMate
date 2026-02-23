'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { JOB_BUDGET_OPTIONS, JOB_SCOPE_OPTIONS, JOB_TITLE_OPTIONS, JOB_URGENCY_OPTIONS } from '@/lib/constants/job';
import EircodeAddressForm from './EircodeAddressForm';
import styles from './forms.module.css';

type Address = {
  eircode: string;
  county?: string;
  locality?: string;
};

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
};

export default function GuestJobIntentForm() {
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [titleOption, setTitleOption] = useState<(typeof JOB_TITLE_OPTIONS)[number] | ''>('');
  const [customTitle, setCustomTitle] = useState('');
  const [scope, setScope] = useState<(typeof JOB_SCOPE_OPTIONS)[number] | ''>('');
  const [urgency, setUrgency] = useState<(typeof JOB_URGENCY_OPTIONS)[number] | ''>('');
  const [details, setDetails] = useState('');
  const [budgetRange, setBudgetRange] = useState<(typeof JOB_BUDGET_OPTIONS)[number]>(JOB_BUDGET_OPTIONS[2]);
  const [address, setAddress] = useState<Address | null>(null);
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [intentId, setIntentId] = useState('');

  useEffect(() => {
    async function loadCategories() {
      const response = await fetch('/api/categories', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Kategoriler alinamadi.');
        return;
      }
      const all = (payload.categories ?? []) as Category[];
      const leaf = all.filter((item) => item.parent_id !== null);
      const selectable = leaf.length > 0 ? leaf : all;
      setCategories(selectable);
      if (selectable.length > 0) {
        setCategoryId(selectable[0].id);
      } else {
        setError('Aktif kategori bulunamadi. Lutfen admin panelinden kategori ekleyin.');
      }
    }
    loadCategories();
  }, []);

  const nextFromStep1 = () => {
    if (!categoryId || !titleOption || (titleOption === 'Other' && !customTitle.trim())) {
      setError('Kategori ve is tipi secimi zorunlu.');
      return;
    }
    setError('');
    setStep(2);
  };

  const nextFromStep2 = () => {
    if (!scope || !urgency || !address?.eircode || !address?.county || !address?.locality) {
      setError('Kapsam, aciliyet ve adres alanlarini tamamla.');
      return;
    }
    setError('');
    setStep(3);
  };

  const onSubmit = async () => {
    const title = titleOption === 'Other' ? customTitle.trim() : titleOption.trim();
    const description = [
      `Scope: ${scope}`,
      `Urgency: ${urgency}`,
      details.trim() ? `Details: ${details.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    if (!email.trim() || !title || !description || !address?.eircode || !address?.county || !address?.locality || !categoryId) {
      setError('Lutfen tum zorunlu alanlari doldur.');
      return;
    }

    setIsPending(true);
    setError('');
    setSuccess('');

    const response = await fetch('/api/guest-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        title,
        category_id: categoryId,
        description,
        eircode: address.eircode,
        county: address.county,
        locality: address.locality,
        budget_range: budgetRange,
        photo_urls: [],
      }),
    });

    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setError(payload.error || 'Taslak olusturulamadi.');
      return;
    }

    setIntentId(payload.intent_id);
    setSuccess('Talebin kaydedildi. Test modunda email onayi atlandi; hesabinla devam ederek ilani yayinlayabilirsin.');
  };

  return (
    <div className={styles.card}>
      <p className={styles.step}>Misafir Talep Akisi - Adim {step}/3</p>
      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}
      {success ? <p className={`${styles.feedback} ${styles.ok}`}>{success}</p> : null}
      <p className={styles.muted}>
        PROD notu: Gercek ortamda ilan yayinlamadan once email dogrulama zorunlu olacak.
      </p>

      {step === 1 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>1) Hizmeti sec</h2>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={styles.select}>
            <option value="">Kategori sec</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select value={titleOption} onChange={(event) => setTitleOption(event.target.value as (typeof JOB_TITLE_OPTIONS)[number])} className={styles.select}>
            <option value="">Is tipi sec</option>
            {JOB_TITLE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {titleOption === 'Other' ? (
            <input className={styles.input} value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="Is tipini yaz" />
          ) : null}

          <div className={styles.buttonRow}>
            <button type="button" className={styles.primary} onClick={nextFromStep1}>
              Devam
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>2) Detaylar</h2>
          <select value={scope} onChange={(event) => setScope(event.target.value as (typeof JOB_SCOPE_OPTIONS)[number])} className={styles.select}>
            <option value="">Is kapsami sec</option>
            {JOB_SCOPE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={urgency} onChange={(event) => setUrgency(event.target.value as (typeof JOB_URGENCY_OPTIONS)[number])} className={styles.select}>
            <option value="">Aciliyet sec</option>
            {JOB_URGENCY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <textarea className={styles.textarea} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Ek detay (opsiyonel)" />
          <select value={budgetRange} onChange={(event) => setBudgetRange(event.target.value as (typeof JOB_BUDGET_OPTIONS)[number])} className={styles.select}>
            {JOB_BUDGET_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <EircodeAddressForm onAddressSelect={setAddress} />
          <div className={styles.buttonRow}>
            <button type="button" className={styles.secondary} onClick={() => setStep(1)}>
              Geri
            </button>
            <button type="button" className={styles.primary} onClick={nextFromStep2}>
              Devam
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>3) Email onayi</h2>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@email.com"
            />
          </label>
          <div className={styles.buttonRow}>
            <button type="button" className={styles.secondary} onClick={() => setStep(2)}>
              Geri
            </button>
            <button type="button" className={styles.primary} onClick={onSubmit} disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : 'Talebi Kaydet'}
            </button>
          </div>
          {intentId ? (
            <div className={styles.buttonRow}>
              <Link className={styles.primary} href={`/${locale}/uye-ol?intent=${intentId}&email=${encodeURIComponent(email.trim().toLowerCase())}`}>
                Hesap olustur ve ilani yayinla
              </Link>
              <Link className={styles.secondary} href={`/${locale}/giris`}>
                Giris yapip devam et
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
