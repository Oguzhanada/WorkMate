'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { JOB_BUDGET_OPTIONS, JOB_SCOPE_OPTIONS, JOB_TITLE_OPTIONS, JOB_URGENCY_OPTIONS } from '@/lib/constants/job';
import EircodeAddressForm from './EircodeAddressForm';
import InfoTooltip from '@/components/ui/InfoTooltip';
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
        setError(payload.error || 'Categories could not be loaded.');
        return;
      }
      const all = (payload.categories ?? []) as Category[];
      const leaf = all.filter((item) => item.parent_id !== null);
      const selectable = leaf.length > 0 ? leaf : all;
      setCategories(selectable);
      if (selectable.length > 0) {
        setCategoryId(selectable[0].id);
      } else {
        setError('No active categories found. Please add categories in the admin panel.');
      }
    }
    loadCategories();
  }, []);

  const nextFromStep1 = () => {
    if (!categoryId || !titleOption || (titleOption === 'Other' && !customTitle.trim())) {
      setError('Category and job type are required.');
      return;
    }
    setError('');
    setStep(2);
  };

  const nextFromStep2 = () => {
    if (!scope || !urgency || !address?.eircode || !address?.county || !address?.locality) {
      setError('Please complete scope, urgency, and address fields.');
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
      setError('Please fill all required fields.');
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
      setError(payload.error || 'Draft could not be created.');
      return;
    }

    setIntentId(payload.intent_id);
    setSuccess('Your request was saved. In test mode, email verification is bypassed; continue with your account to publish the listing.');
  };

  return (
    <div className={styles.card}>
      <p className={styles.step}>Guest Request Flow - Step {step}/3</p>
      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}
      {success ? <p className={`${styles.feedback} ${styles.ok}`}>{success}</p> : null}
      <p className={styles.muted}>
        PROD note: Email verification will be required before publishing listings in production.
      </p>

      {step === 1 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>1) Select Service</h2>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={styles.select}>
            <option value="">Select category</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select value={titleOption} onChange={(event) => setTitleOption(event.target.value as (typeof JOB_TITLE_OPTIONS)[number])} className={styles.select}>
            <option value="">Select job type</option>
            {JOB_TITLE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {titleOption === 'Other' ? (
            <input className={styles.input} value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="Type job title" />
          ) : null}

          <div className={styles.buttonRow}>
            <button type="button" className={styles.primary} onClick={nextFromStep1}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>2) Details</h2>
          <select value={scope} onChange={(event) => setScope(event.target.value as (typeof JOB_SCOPE_OPTIONS)[number])} className={styles.select}>
            <option value="">Select scope</option>
            {JOB_SCOPE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={urgency} onChange={(event) => setUrgency(event.target.value as (typeof JOB_URGENCY_OPTIONS)[number])} className={styles.select}>
            <option value="">Select urgency</option>
            {JOB_URGENCY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <textarea className={styles.textarea} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Additional details (optional)" />
          <div className={styles.field}>
            <span>
              Budget{' '}
              <InfoTooltip text="Set your estimated range. Providers can still send their own offers." />
            </span>
          </div>
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
              Back
            </button>
            <button type="button" className={styles.primary} onClick={nextFromStep2}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={styles.field}>
          <h2 className={styles.title}>3) Email Confirmation</h2>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
            />
          </label>
          <div className={styles.buttonRow}>
            <button type="button" className={styles.secondary} onClick={() => setStep(2)}>
              Back
            </button>
            <button type="button" className={styles.primary} onClick={onSubmit} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Request'}
            </button>
          </div>
          {intentId ? (
            <div className={styles.buttonRow}>
              <Link className={styles.primary} href={`/sign-up?intent=${intentId}&email=${encodeURIComponent(email.trim().toLowerCase())}`}>
                Create account and publish listing
              </Link>
              <Link className={styles.secondary} href={`/login`}>
                Sign in and continue
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

