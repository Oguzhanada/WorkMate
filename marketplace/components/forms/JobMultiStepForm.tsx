'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import EircodeAddressForm from './EircodeAddressForm';
import {
  JOB_BUDGET_OPTIONS,
  JOB_SCOPE_OPTIONS,
  JOB_TITLE_OPTIONS,
  JOB_URGENCY_OPTIONS,
} from '@/lib/constants/job';
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

export default function JobMultiStepForm({ customerId }: { customerId: string }) {
  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [titleOption, setTitleOption] = useState<(typeof JOB_TITLE_OPTIONS)[number] | ''>('');
  const [customTitle, setCustomTitle] = useState('');
  const [scope, setScope] = useState<(typeof JOB_SCOPE_OPTIONS)[number] | ''>('');
  const [urgency, setUrgency] = useState<(typeof JOB_URGENCY_OPTIONS)[number] | ''>('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [budgetRange, setBudgetRange] = useState<(typeof JOB_BUDGET_OPTIONS)[number]>(JOB_BUDGET_OPTIONS[2]);
  const [address, setAddress] = useState<Address | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);
      const response = await fetch('/api/categories', { cache: 'no-store' });
      const payload = await response.json();
      setIsLoadingCategories(false);
      if (!response.ok) {
        setError(payload.error || 'Kategoriler alinamadi.');
        return;
      }
      const all = (payload.categories ?? []) as Category[];
      const leaf = all.filter((item) => item.parent_id !== null);
      setCategories(leaf);
      if (leaf.length > 0) setCategoryId(leaf[0].id);
    }
    loadCategories();
  }, []);

  const uploadPhotos = async () => {
    const urls: string[] = [];
    for (const file of photos) {
      const path = `jobs/${customerId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('job-photos').upload(path, file);
      if (!uploadError) urls.push(path);
    }
    return urls;
  };

  const submitJob = async () => {
    const resolvedTitle = titleOption === 'Other' ? customTitle.trim() : titleOption.trim();
    const resolvedDescription = [
      `Scope: ${scope}`,
      `Urgency: ${urgency}`,
      additionalDetails.trim() ? `Details: ${additionalDetails.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    if (!resolvedTitle || !resolvedDescription || !address?.eircode || !address?.county || !address?.locality || !categoryId) {
      setError('Lutfen kategori, is tipi, kapsam, aciliyet, county, sehir ve Eircode bilgisini tamamla.');
      return;
    }

    setError('');
    setFeedback('');
    setIsPending(true);

    const photoUrls = await uploadPhotos();
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: resolvedTitle,
        category_id: categoryId,
        description: resolvedDescription,
        eircode: address.eircode,
        county: address.county,
        locality: address.locality,
        budget_range: budgetRange,
        photo_urls: photoUrls,
      }),
    });

    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setError(payload.error || 'Is talebi olusturulamadi.');
      return;
    }

    setFeedback('Is talebin basariyla olusturuldu. Kisa surede teklifler gelmeye baslar.');
    setStep(1);
    setTitleOption('');
    setCustomTitle('');
    setScope('');
    setUrgency('');
    setAdditionalDetails('');
    setPhotos([]);
  };

  return (
    <div className={styles.card}>
      <p className={styles.step}>Adim {step}/3</p>
      {feedback ? <p className={`${styles.feedback} ${styles.ok}`}>{feedback}</p> : null}
      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}

      {step === 1 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>1) Kategori ve Is Ozeti</h2>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={styles.select} disabled={isLoadingCategories}>
            <option value="">{isLoadingCategories ? 'Kategoriler yukleniyor...' : 'Kategori sec'}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select value={titleOption} onChange={(e) => setTitleOption(e.target.value as (typeof JOB_TITLE_OPTIONS)[number])} className={styles.select}>
            <option value="">Is tipi sec</option>
            {JOB_TITLE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {titleOption === 'Other' ? (
            <input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Is tipini yaz"
              className={styles.input}
            />
          ) : null}

          <select value={scope} onChange={(e) => setScope(e.target.value as (typeof JOB_SCOPE_OPTIONS)[number])} className={styles.select}>
            <option value="">Is kapsami sec</option>
            {JOB_SCOPE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={urgency} onChange={(e) => setUrgency(e.target.value as (typeof JOB_URGENCY_OPTIONS)[number])} className={styles.select}>
            <option value="">Aciliyet sec</option>
            {JOB_URGENCY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <textarea
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="Ek detay (opsiyonel)"
            className={styles.textarea}
            rows={4}
          />
          <div className={styles.buttonRow}>
            <button type="button" onClick={() => setStep(2)} className={styles.primary}>
              Devam
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>2) Adres ve Butce</h2>
          <EircodeAddressForm onAddressSelect={setAddress} />
          <select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value as (typeof JOB_BUDGET_OPTIONS)[number])} className={styles.select}>
            {JOB_BUDGET_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div className={styles.buttonRow}>
            <button type="button" onClick={() => setStep(1)} className={styles.secondary}>
              Geri
            </button>
            <button type="button" onClick={() => setStep(3)} className={styles.primary}>
              Devam
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>3) Fotograf Yukleme</h2>
          <input className={styles.input} type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
          <div className={styles.buttonRow}>
            <button type="button" onClick={() => setStep(2)} className={styles.secondary}>
              Geri
            </button>
            <button type="button" onClick={submitJob} disabled={isPending} className={styles.primary}>
              {isPending ? 'Gonderiliyor...' : 'Is Talebini Olustur'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
