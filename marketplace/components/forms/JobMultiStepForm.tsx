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
import { getTaxonomyCategories } from '@/lib/service-taxonomy';
import InfoTooltip from '@/components/ui/InfoTooltip';
import styles from './forms.module.css';

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
};

const STEP_LABELS = ['Title and details', 'Location and budget', 'Photos and submit'] as const;

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
  const [categoryNotice, setCategoryNotice] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);
      const fallbackCategories = (getTaxonomyCategories() as Category[]).filter(
        (item) => item.parent_id !== null
      );
      try {
        const response = await fetch('/api/categories', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Categories could not be loaded.');
        }

        const all = (payload.categories ?? []) as Category[];
        const leaf = all.filter((item) => item.parent_id !== null);
        const usable = leaf.length > 0 ? leaf : all;

        if (usable.length === 0) {
          setCategories(fallbackCategories);
          setCategoryNotice('Service categories are temporarily unavailable. Showing fallback options.');
          setError('');
          setCategoryId((current) => current || fallbackCategories[0]?.id || '');
          return;
        }

        setCategories(usable);
        setCategoryNotice('');
        setError('');
        setCategoryId((current) => (current && usable.some((item) => item.id === current) ? current : usable[0].id));
      } catch {
        setCategories(fallbackCategories);
        setCategoryNotice('Service categories are temporarily unavailable. Showing fallback options.');
        setError('');
        setCategoryId((current) => current || fallbackCategories[0]?.id || '');
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const uploadPhotos = async () => {
    const urls: string[] = [];
    for (const file of photos) {
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed.');
      }
      const path = `jobs/${customerId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('job-photos').upload(path, file);
      if (uploadError) {
        throw new Error(uploadError.message || 'Photo upload failed.');
      }
      urls.push(path);
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

    try {
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

      const payload = await response.json().catch(() => ({}));

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
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Job request could not be created.';
      setError(message);
    } finally {
      setIsPending(false);
    }
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
      <div className={styles.wizardLayout}>
        <aside className={styles.wizardSidebar}>
          <h3 className={styles.wizardSidebarTitle}>Post a task</h3>
          <ol className={styles.wizardSteps}>
            {STEP_LABELS.map((label, index) => {
              const stepNo = index + 1;
              return (
                <li
                  key={label}
                  className={`${styles.wizardStepItem} ${step === stepNo ? styles.wizardStepItemActive : ''} ${
                    step > stepNo ? styles.wizardStepItemDone : ''
                  }`}
                >
                  <span className={styles.wizardStepDot} />
                  <span>{label}</span>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className={styles.wizardMain}>
          {step === 1 ? (
            <div className={styles.field}>
              <h2 className={styles.title}>Let&apos;s start with the basics</h2>
              <p className={styles.sectionLead}>Tell providers what you need and when you need it.</p>

              <label className={styles.field}>
                <span>Service category</span>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={styles.select}
                  disabled={isLoadingCategories || categories.length === 0}
                >
                  <option value="">{isLoadingCategories ? 'Loading categories...' : 'Select category'}</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {categoryNotice ? <small className={styles.muted}>{categoryNotice}</small> : null}
              </label>

              <label className={styles.field}>
                <span>In a few words, what do you need done?</span>
                <select value={titleOption} onChange={(e) => setTitleOption(e.target.value as (typeof JOB_TITLE_OPTIONS)[number])} className={styles.select}>
                  <option value="">Select job type</option>
                  {JOB_TITLE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              {titleOption === 'Other' ? (
                <input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Type job title"
                  className={styles.input}
                />
              ) : null}

              <label className={styles.field}>
                <span>Scope</span>
                <select value={scope} onChange={(e) => setScope(e.target.value as (typeof JOB_SCOPE_OPTIONS)[number])} className={styles.select}>
                  <option value="">Select scope</option>
                  {JOB_SCOPE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.field}>
                <span>When do you need this done?</span>
                <div className={styles.chipRow}>
                  {JOB_URGENCY_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`${styles.chip} ${urgency === item ? styles.chipActive : ''}`}
                      onClick={() => setUrgency(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

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
              <h2 className={styles.title}>Location and budget</h2>
              <p className={styles.sectionLead}>Add your address so local providers can match your request.</p>
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
              <h2 className={styles.title}>Add photos and submit</h2>
              <p className={styles.sectionLead}>Upload optional photos to help providers quote faster.</p>
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
      </div>
    </div>
  );
}
