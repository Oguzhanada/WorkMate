'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import EircodeAddressForm, { type Address } from './EircodeAddressForm';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import {
  JOB_BUDGET_OPTIONS,
  JOB_SCOPE_OPTIONS,
  JOB_TITLE_OPTIONS,
  JOB_URGENCY_OPTIONS,
} from '@/lib/constants/job';
import type { JobMode, TaskType } from '@/lib/types/airtasker';
import { useCategoriesWithFallback, type Category } from '@/lib/hooks/useCategoriesWithFallback';
import InfoTooltip from '@/components/ui/InfoTooltip';
import HybridJobPost from '@/components/jobs/HybridJobPost';
import styles from './forms.module.css';

const STEP_LABELS = ['Title and details', 'Location and budget', 'Photos and submit'] as const;
const STEP_GOALS: Record<number, string> = {
  1: 'Define what needs to be done and how you want providers to respond.',
  2: 'Confirm location details so only relevant providers can see your request.',
  3: 'Add optional photos and submit your request for review.'
};
const STEP_ANIMATION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: 'easeOut' as const }
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function JobMultiStepForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);
  const searchParams = useSearchParams();
  const urlMode = (searchParams.get('mode') as JobMode | null) ?? 'get_quotes';
  const urlProviderId = searchParams.get('provider_id');

  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const {categories, isLoading: isLoadingCategories, notice: categoryNotice, isFallback} = useCategoriesWithFallback({
    leafOnly: true
  });
  const [titleOption, setTitleOption] = useState<(typeof JOB_TITLE_OPTIONS)[number] | ''>('');
  const [customTitle, setCustomTitle] = useState('');
  const [jobMode, setJobMode] = useState<JobMode>(urlMode);
  const [targetProviderId] = useState<string | null>(urlProviderId);
  const [taskType, setTaskType] = useState<TaskType>('in_person');
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
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [priceEstimate, setPriceEstimate] = useState<{
    p25Cents: number;
    p75Cents: number;
    medianCents: number;
    sampleSize: number;
  } | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const progressPercent = Math.round((step / 3) * 100);

  const getFriendlyApiError = (payload: any) => {
    const apiError = String(payload?.error ?? '').trim().toLowerCase();
    if (!apiError) return 'We could not create your request. Please review the highlighted fields and try again.';
    if (apiError.includes('valid eircode')) {
      return 'Your Eircode looks invalid. Use a valid 7-character Irish Eircode (for example: D02 Y006).';
    }
    if (apiError.includes('invalid category')) {
      return 'The selected service category is no longer available. Please pick another category and retry.';
    }
    if (apiError.includes('direct request requires')) {
      return 'Direct Request needs a selected provider. Choose a provider from the Providers page and try again.';
    }
    return payload.error || 'We could not create your request. Please review the highlighted fields and try again.';
  };

  useEffect(() => {
    setCategoryId((current) => {
      if (current && categories.some((item) => item.id === current)) return current;
      return categories[0]?.id || '';
    });
  }, [categories]);

  useEffect(() => {
    if (categories.length === 0 && !isLoadingCategories) {
      setError('No active categories are available right now. Please try again shortly.');
    } else if (error.startsWith('No active categories')) {
      setError('');
    }
  }, [categories.length, error, isLoadingCategories]);

  useEffect(() => {
    if (!categoryId) {
      setPriceEstimate(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/categories/${categoryId}/price-estimate`)
      .then((res) => res.json())
      .then((payload: { estimate: typeof priceEstimate }) => {
        if (!cancelled) setPriceEstimate(payload.estimate ?? null);
      })
      .catch(() => {
        if (!cancelled) setPriceEstimate(null);
      });
    return () => { cancelled = true; };
  }, [categoryId]);

  const uploadPhotos = async () => {
    const supabase = getSupabaseBrowserClient();
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
    if (isFallback || !UUID_PATTERN.test(categoryId)) {
      setError('Service categories are still syncing. Please refresh and try again in a moment.');
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
          job_mode: jobMode,
          task_type: taskType,
          target_provider_id: targetProviderId ?? null,
          photo_urls: photoUrls,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload?.error === 'identity_required') {
          window.location.href =
            payload?.redirect_to || withLocalePrefix(localeRoot, '/profile?message=identity_required');
          return;
        }
        if (payload?.error === 'Validation failed' && payload?.details?.fieldErrors) {
          const firstFieldError = Object.values(payload.details.fieldErrors)
            .flat()
            .find((item): item is string => typeof item === 'string' && item.trim().length > 0);
          setError(firstFieldError || 'Some required details are missing. Please review this step and try again.');
          return;
        }
        setError(getFriendlyApiError(payload));
        return;
      }

      if (!payload?.job?.id) {
        setError('Job was created but result summary could not be opened. Please check My posted jobs.');
        return;
      }

      setFeedback('Your job request was created successfully.');
      router.push(withLocalePrefix(localeRoot, `/post-job/result/${payload.job.id}`));
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Job request could not be created.';
      setError(message);
    } finally {
      setIsPending(false);
    }
  };

  const getStepValidationError = (targetStep: number) => {
    if (targetStep === 1) {
      if (!categoryId) return 'Choose a service category to continue.';
      if (!titleOption) return 'Choose the job type that best matches your request.';
      if (titleOption === 'Other' && !customTitle.trim()) return 'Enter a short custom title for your request.';
      if (!scope) return 'Select the job scope to continue.';
      if (!urgency) return 'Select when you need this done.';
      return '';
    }

    if (targetStep === 2) {
      if (!address.eircode) return 'Enter your Eircode so providers can match your location.';
      if (!address.eircode_valid) return 'Please enter a valid Eircode before continuing.';
      if (!address.county || !address.locality || !address.address_line_1) {
        return 'Complete county, city, and address line 1 to continue.';
      }
      return '';
    }

    if (targetStep === 3) {
      if (isFallback || !UUID_PATTERN.test(categoryId)) {
        return 'Service categories are still syncing. Refresh in a moment and try again.';
      }
    }

    return '';
  };

  const currentStepError = getStepValidationError(step);

  const generateDescription = async () => {
    const resolvedTitle = titleOption === 'Other' ? customTitle.trim() : titleOption;
    const categoryObj = categories.find((item: Category) => item.id === categoryId);
    if (!resolvedTitle || !categoryObj) return;

    setIsGeneratingDescription(true);
    try {
      const res = await fetch('/api/ai/job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: resolvedTitle,
          categoryName: categoryObj.name,
          scope: scope || undefined,
          urgency: urgency || undefined,
          taskType: taskType,
        }),
      });
      const payload = await res.json() as { description?: string; error?: string };
      if (res.ok && payload.description) {
        setAdditionalDetails(payload.description);
      }
    } catch {
      // silent — user can still type manually
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const nextFromStep2 = () => {
    const validationError = getStepValidationError(2);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(3);
  };

  return (
    <div className={styles.card}>
      <p className={styles.step}>Step {step}/3</p>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>
      <p className={styles.stepDetail}>Progress: {progressPercent}% complete</p>
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
          <div className={styles.goalCard}>
            <p className={styles.goalTitle}>Step goal</p>
            <p className={styles.goalText}>{STEP_GOALS[step]}</p>
          </div>
        </aside>

        <div className={styles.wizardMain}>
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 ? (
              <motion.div
                key="step-1"
                className={styles.field}
                initial={STEP_ANIMATION.initial}
                animate={STEP_ANIMATION.animate}
                exit={STEP_ANIMATION.exit}
                transition={STEP_ANIMATION.transition}
              >
              <h2 className={styles.title}>Let&apos;s start with the basics</h2>
              <p className={styles.sectionLead}>Tell providers what you need and when you need it.</p>

              <HybridJobPost selectedMode={jobMode} onModeSelect={setJobMode} />

              {jobMode === 'direct_request' && targetProviderId ? (
                <p className={styles.notice}>
                  This job will be sent directly to the selected provider. Only they can respond to it.
                </p>
              ) : (
                <div className={styles.inlineCta}>
                  <p className={styles.muted}>Want faster responses from one trusted provider?</p>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => router.push(withLocalePrefix(localeRoot, '/providers'))}
                  >
                    Browse providers for Direct Request
                  </button>
                </div>
              )}

              <div className={styles.field}>
                <span>Task type</span>
                <div className={styles.chipRow}>
                  {(['in_person', 'remote', 'flexible'] as TaskType[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.chip} ${taskType === value ? styles.chipActive : ''}`}
                      onClick={() => setTaskType(value)}
                    >
                      {value === 'in_person'
                        ? 'In person'
                        : value === 'remote'
                          ? 'Remote'
                          : 'Flexible'}
                    </button>
                  ))}
                </div>
              </div>

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

              <div className={styles.field}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span>Additional details</span>
                  <button
                    type="button"
                    onClick={generateDescription}
                    disabled={isGeneratingDescription || !titleOption || !categoryId}
                    className={styles.secondary}
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', whiteSpace: 'nowrap' }}
                  >
                    <span className={styles.buttonContent}>
                      {isGeneratingDescription ? <Loader2 className={styles.inlineSpinner} /> : null}
                      {isGeneratingDescription ? 'Writing...' : '✨ AI-write'}
                    </span>
                  </button>
                </div>
                <textarea
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder="Describe what you need done, or tap AI-write to auto-generate a description."
                  className={styles.textarea}
                  rows={4}
                />
              </div>
              <div className={styles.buttonRow}>
                <button type="button" onClick={() => setStep(2)} className={styles.primary} disabled={Boolean(currentStepError)}>
                  Continue
                </button>
              </div>
              </motion.div>
            ) : null}

            {step === 2 ? (
              <motion.div
                key="step-2"
                className={styles.field}
                initial={STEP_ANIMATION.initial}
                animate={STEP_ANIMATION.animate}
                exit={STEP_ANIMATION.exit}
                transition={STEP_ANIMATION.transition}
              >
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
              {priceEstimate ? (
                <p className={styles.muted}>
                  💡 Based on {priceEstimate.sampleSize} accepted jobs in this category — typical range:{' '}
                  <strong>
                    €{Math.round(priceEstimate.p25Cents / 100)}–€{Math.round(priceEstimate.p75Cents / 100)}
                  </strong>{' '}
                  (median €{Math.round(priceEstimate.medianCents / 100)})
                </p>
              ) : null}
              <div className={styles.buttonRow}>
                <button type="button" onClick={() => setStep(1)} className={styles.secondary}>
                  Back
                </button>
                <button type="button" onClick={nextFromStep2} className={styles.primary}>
                  Continue
                </button>
              </div>
              </motion.div>
            ) : null}

            {step === 3 ? (
              <motion.div
                key="step-3"
                className={styles.field}
                initial={STEP_ANIMATION.initial}
                animate={STEP_ANIMATION.animate}
                exit={STEP_ANIMATION.exit}
                transition={STEP_ANIMATION.transition}
              >
              <h2 className={styles.title}>Add photos and submit</h2>
              <p className={styles.sectionLead}>Upload optional photos to help providers quote faster.</p>
              <input className={styles.input} type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
              <div className={styles.buttonRow}>
                <button type="button" onClick={() => setStep(2)} className={styles.secondary}>
                  Back
                </button>
                <button
                  type="button"
                  onClick={submitJob}
                  disabled={isPending || Boolean(currentStepError)}
                  className={styles.primary}
                >
                  <span className={styles.buttonContent}>
                    {isPending ? <Loader2 className={styles.inlineSpinner} /> : null}
                    {isPending ? 'Submitting...' : 'Create Job Request'}
                  </span>
                </button>
              </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
