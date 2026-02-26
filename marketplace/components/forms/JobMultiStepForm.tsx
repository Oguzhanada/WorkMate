'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import EircodeAddressForm, { type Address } from './EircodeAddressForm';
import {
  JOB_BUDGET_OPTIONS,
  JOB_SCOPE_OPTIONS,
  JOB_TITLE_OPTIONS,
  JOB_URGENCY_OPTIONS,
} from '@/lib/constants/job';
import InfoTooltip from '@/components/ui/InfoTooltip';
import styles from './forms.module.css';

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
};

export default function JobMultiStepForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [titleOption, setTitleOption] = useState<(typeof JOB_TITLE_OPTIONS)[number] | ''>('');
  const [customTitle, setCustomTitle] = useState('');
  const [scope, setScope] = useState<(typeof JOB_SCOPE_OPTIONS)[number] | ''>('');
  const [urgency, setUrgency] = useState<(typeof JOB_URGENCY_OPTIONS)[number] | ''>('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [budgetRange, setBudgetRange] = useState<(typeof JOB_BUDGET_OPTIONS)[number]>(JOB_BUDGET_OPTIONS[2]);
  const [address, setAddress] = useState<Address>({
    address_line_1: '',
    address_line_2: '',
    eircode: '',
    county: '',
    locality: '',
    eircode_valid: false,
  });
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
        setError(payload.error || 'Categories could not be loaded.');
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
      setError('Please complete category, job type, scope, urgency, county, city, and Eircode.');
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
      if (payload?.error === 'identity_required') {
        window.location.href = payload?.redirect_to || '/profile?message=identity_required';
        return;
      }
      setError(payload.error || 'Job request could not be created.');
      return;
    }

    if (!payload?.job?.id) {
      setError('Job was created but result summary could not be opened. Please check My posted jobs.');
      return;
    }

    setFeedback('Your job request was created successfully.');
    router.push(`/post-job/result/${payload.job.id}`);
  };

  const nextFromStep2 = () => {
    if (!address.eircode || !address.county || !address.locality || !address.address_line_1) {
      setError('Please complete street, county, city and Eircode. Eircode is important for accurate provider matching.');
      return;
    }
    if (!address.eircode_valid) {
      setError('Eircode is not validated. Please correct it before continuing.');
      return;
    }
    setError('');
    setStep(3);
  };

  return (
    <div className={styles.card}>
      <p className={styles.step}>Step {step}/3</p>
      {feedback ? <p className={`${styles.feedback} ${styles.ok}`}>{feedback}</p> : null}
      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}

      {step === 1 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>1) Category and Job Summary</h2>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={styles.select} disabled={isLoadingCategories}>
            <option value="">{isLoadingCategories ? 'Loading categories...' : 'Select category'}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select value={titleOption} onChange={(e) => setTitleOption(e.target.value as (typeof JOB_TITLE_OPTIONS)[number])} className={styles.select}>
            <option value="">Select job type</option>
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
              placeholder="Type job title"
              className={styles.input}
            />
          ) : null}

          <select value={scope} onChange={(e) => setScope(e.target.value as (typeof JOB_SCOPE_OPTIONS)[number])} className={styles.select}>
            <option value="">Select scope</option>
            {JOB_SCOPE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={urgency} onChange={(e) => setUrgency(e.target.value as (typeof JOB_URGENCY_OPTIONS)[number])} className={styles.select}>
            <option value="">Select urgency</option>
            {JOB_URGENCY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <textarea
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="Additional details (optional)"
            className={styles.textarea}
            rows={4}
          />
          <div className={styles.buttonRow}>
            <button type="button" onClick={() => setStep(2)} className={styles.primary}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>2) Address and Budget</h2>
          <EircodeAddressForm value={address} onChange={setAddress} />
          <div className={styles.field}>
            <span>
              Budget{' '}
              <InfoTooltip text="Set an estimated budget. Providers can send custom offers based on scope, urgency, and materials." />
            </span>
          </div>
          <select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value as (typeof JOB_BUDGET_OPTIONS)[number])} className={styles.select}>
            {JOB_BUDGET_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div className={styles.buttonRow}>
            <button type="button" onClick={() => setStep(1)} className={styles.secondary}>
              Back
            </button>
            <button type="button" onClick={nextFromStep2} className={styles.primary}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>3) Photo Upload</h2>
          <input className={styles.input} type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
          <div className={styles.buttonRow}>
            <button type="button" onClick={() => setStep(2)} className={styles.secondary}>
              Back
            </button>
            <button type="button" onClick={submitJob} disabled={isPending} className={styles.primary}>
              {isPending ? 'Submitting...' : 'Create Job Request'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
