'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { JOB_BUDGET_OPTIONS, JOB_SCOPE_OPTIONS, JOB_TITLE_OPTIONS, JOB_URGENCY_OPTIONS } from '@/lib/constants/job';
import { useCategoriesWithFallback, type Category } from '@/lib/hooks/useCategoriesWithFallback';
import EircodeAddressForm, { type Address } from './EircodeAddressForm';
import InfoTooltip from '@/components/ui/InfoTooltip';
import styles from './forms.module.css';

const STEP_LABELS = ['Title and details', 'Location and budget', 'Email confirmation'] as const;

export default function GuestJobIntentForm() {
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const {categories, isLoading: isLoadingCategories, notice: categoryNotice} = useCategoriesWithFallback({
    leafOnly: true
  });
  const [categoryId, setCategoryId] = useState('');
  const [titleOption, setTitleOption] = useState<(typeof JOB_TITLE_OPTIONS)[number] | ''>('');
  const [customTitle, setCustomTitle] = useState('');
  const [scope, setScope] = useState<(typeof JOB_SCOPE_OPTIONS)[number] | ''>('');
  const [urgency, setUrgency] = useState<(typeof JOB_URGENCY_OPTIONS)[number] | ''>('');
  const [details, setDetails] = useState('');
  const [budgetRange, setBudgetRange] = useState<(typeof JOB_BUDGET_OPTIONS)[number]>(JOB_BUDGET_OPTIONS[2]);
  const [address, setAddress] = useState<Address>({
    address_line_1: '',
    address_line_2: '',
    eircode: '',
    county: '',
    locality: '',
    eircode_valid: false,
  });
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [intentId, setIntentId] = useState('');

  useEffect(() => {
    queueMicrotask(() => {
      setCategoryId((current) => {
        if (current && categories.some((item) => item.id === current)) return current;
        return categories[0]?.id || '';
      });
    });
  }, [categories]);

  useEffect(() => {
    queueMicrotask(() => {
      if (categories.length === 0 && !isLoadingCategories) {
        setError('No active categories are available right now. Please try again shortly.');
      } else {
        setError((prev) => prev.startsWith('No active categories') ? '' : prev);
      }
    });
  }, [categories.length, isLoadingCategories]);

  const nextFromStep1 = () => {
    if (!categoryId || !titleOption || (titleOption === 'Other' && !customTitle.trim())) {
      setError('Category and job type are required.');
      return;
    }
    setError('');
    setStep(2);
  };

  const nextFromStep2 = () => {
    if (!scope || !urgency || !address.eircode || !address.county || !address.locality || !address.address_line_1) {
      setError('Please complete scope, urgency, and address fields.');
      return;
    }
    if (!address.eircode_valid) {
      setError('Please enter a valid Eircode. This is important for local provider matching.');
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

    if (!email.trim() || !title || !description || !address.eircode || !address.county || !address.locality || !categoryId) {
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
              <p className={styles.sectionLead}>Add the core details so providers understand your request.</p>

              <label className={styles.field}>
                <span>Service category</span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
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
                <select value={titleOption} onChange={(event) => setTitleOption(event.target.value as (typeof JOB_TITLE_OPTIONS)[number])} className={styles.select}>
                  <option value="">Select job type</option>
                  {JOB_TITLE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

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
              <h2 className={styles.title}>Location and budget</h2>
              <p className={styles.sectionLead}>Set your timeline, address and budget range.</p>
              <select value={scope} onChange={(event) => setScope(event.target.value as (typeof JOB_SCOPE_OPTIONS)[number])} className={styles.select}>
                <option value="">Select scope</option>
                {JOB_SCOPE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
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
              <textarea className={styles.textarea} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Additional details (optional)" />
              <div className={styles.field}>
                <span>
                  Budget{' '}
                  <InfoTooltip text="Set an estimated budget. Providers can send custom offers based on scope, urgency, and materials." />
                </span>
              </div>
              <select value={budgetRange} onChange={(event) => setBudgetRange(event.target.value as (typeof JOB_BUDGET_OPTIONS)[number])} className={styles.select}>
                {JOB_BUDGET_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <EircodeAddressForm value={address} onChange={setAddress} />
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
              <h2 className={styles.title}>Email confirmation</h2>
              <p className={styles.sectionLead}>Save your request and continue with sign up or login.</p>
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
      </div>
    </div>
  );
}

