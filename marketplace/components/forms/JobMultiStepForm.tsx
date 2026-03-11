'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ChevronDown, MapPin, Pencil, Search, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import EircodeAddressForm, { type Address } from './EircodeAddressForm';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import {
  JOB_BUDGET_OPTIONS,
  JOB_SCOPE_OPTIONS,
  JOB_SCOPE_DESCRIPTIONS,
  JOB_URGENCY_OPTIONS,
} from '@/lib/data/budgets';
import type { JobMode, TaskType } from '@/lib/types/airtasker';
import { useCategoriesWithFallback, type Category } from '@/lib/hooks/useCategoriesWithFallback';
import Button from '@/components/ui/Button';
import InfoTooltip from '@/components/ui/InfoTooltip';
import HybridJobPost from '@/components/jobs/HybridJobPost';
import styles from './forms.module.css';
import { trackFunnelStep, FUNNEL_JOB_POSTING } from '@/lib/analytics/funnel';

/* ── Test-data filter for categories ─────────────────────── */
const TEST_CATEGORY_PATTERN = /QA|E2E|test|^\d+$/i;

const STEP_LABELS = ['What do you need?', 'Details and location', 'Review and submit'] as const;
const STEP_GOALS: Record<number, string> = {
  1: 'Tell us what you need done so providers can understand your request.',
  2: 'Add timing, scope, location, and budget details.',
  3: 'Review everything and submit your request.',
};
const STEP_ANIMATION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: 'easeOut' as const },
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* ── Category grouping helper ────────────────────────────── */
type GroupedCategory = { parentName: string; children: Category[] };

function groupCategories(allCategories: Category[], leafCategories: Category[]): GroupedCategory[] {
  const parentMap = new Map<string, Category>();
  for (const cat of allCategories) {
    if (cat.parent_id === null) parentMap.set(cat.id, cat);
  }

  const groups = new Map<string, GroupedCategory>();
  const ungrouped: Category[] = [];

  for (const leaf of leafCategories) {
    if (TEST_CATEGORY_PATTERN.test(leaf.name)) continue;
    if (leaf.parent_id && parentMap.has(leaf.parent_id)) {
      const parent = parentMap.get(leaf.parent_id)!;
      if (!groups.has(parent.id)) {
        groups.set(parent.id, { parentName: parent.name, children: [] });
      }
      groups.get(parent.id)!.children.push(leaf);
    } else {
      ungrouped.push(leaf);
    }
  }

  const result = Array.from(groups.values());
  if (ungrouped.length > 0) {
    result.push({ parentName: 'Other', children: ungrouped });
  }
  return result;
}

export default function JobMultiStepForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);
  const searchParams = useSearchParams();
  const urlMode = (searchParams.get('mode') as JobMode | null) ?? 'get_quotes';
  const urlProviderId = searchParams.get('provider_id');

  const [step, setStep] = useState(1);

  /* ── Categories — fetch ALL (parents + leaves) for grouping ── */
  const { categories: leafCategories, isLoading: isLoadingCategories, notice: categoryNotice, isFallback } = useCategoriesWithFallback({ leafOnly: true });
  const { categories: allCategories } = useCategoriesWithFallback({ leafOnly: false });

  const [categoryId, setCategoryId] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Provider pre-selection state (must be before filteredLeafCategories useMemo) ── */
  const [providerCategoryIds, setProviderCategoryIds] = useState<string[]>([]);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [customerIdStatus, setCustomerIdStatus] = useState<string | null>(null);

  /* ── Filter out test categories; when a provider is pre-selected, ── */
  /* ── also restrict to that provider's registered service categories ── */
  const filteredLeafCategories = useMemo(() => {
    const noTest = leafCategories.filter((c) => !TEST_CATEGORY_PATTERN.test(c.name));
    if (urlProviderId && providerCategoryIds.length > 0) {
      const providerSet = new Set(providerCategoryIds);
      return noTest.filter((c) => providerSet.has(c.id));
    }
    return noTest;
  }, [leafCategories, urlProviderId, providerCategoryIds]);

  const groupedCategories = useMemo(
    () => groupCategories(allCategories, leafCategories),
    [allCategories, leafCategories]
  );

  const searchFilteredGroups = useMemo(() => {
    if (!categorySearch.trim()) return groupedCategories;
    const q = categorySearch.toLowerCase();
    return groupedCategories
      .map((group) => ({
        ...group,
        children: group.children.filter(
          (c) => c.name.toLowerCase().includes(q) || group.parentName.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.children.length > 0);
  }, [groupedCategories, categorySearch]);

  const selectedCategory = filteredLeafCategories.find((c) => c.id === categoryId);

  /* ── Form state ─────────────────────────────────────────── */
  const [title, setTitle] = useState('');
  const [jobMode, setJobMode] = useState<JobMode>(urlMode);
  const [targetProviderId] = useState<string | null>(urlProviderId);
  const [taskType, setTaskType] = useState<TaskType>('in_person');
  const [scope, setScope] = useState<(typeof JOB_SCOPE_OPTIONS)[number] | ''>('');
  const [urgency, setUrgency] = useState<(typeof JOB_URGENCY_OPTIONS)[number] | ''>('');
  const [targetDate, setTargetDate] = useState('');
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
  const trackedCategoryRef = useRef<string>('');
  const [priceEstimate, setPriceEstimate] = useState<{
    p25Cents: number;
    p75Cents: number;
    medianCents: number;
    sampleSize: number;
  } | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const progressPercent = Math.round((step / 3) * 100);

  /* ── Close category dropdown on outside click ──────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getFriendlyApiError = (payload: { error?: string; [key: string]: unknown }) => {
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

  // Fetch provider's registered service categories when arriving from a provider profile
  useEffect(() => {
    if (!urlProviderId) return;
    fetch(`/api/providers/${urlProviderId}/services`)
      .then((res) => res.json())
      .then((payload: { category_ids?: string[]; provider_name?: string | null }) => {
        if (payload.category_ids) setProviderCategoryIds(payload.category_ids);
        if (payload.provider_name) setProviderName(payload.provider_name);
      })
      .catch(() => { /* non-critical — fall back to all categories */ });
  }, [urlProviderId]);

  // Fetch customer's ID verification status to determine quote mode
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from('profiles')
      .select('id_verification_status')
      .eq('id', customerId)
      .maybeSingle()
      .then(({ data }) => {
        setCustomerIdStatus(data?.id_verification_status ?? 'none');
      });
  }, [customerId]);

  // Track funnel start once on mount
  useEffect(() => {
    trackFunnelStep({ funnelName: FUNNEL_JOB_POSTING, stepName: 'job_posting_started', stepNumber: 1 });

  }, []);

  useEffect(() => {
    setCategoryId((current) => {
      if (current && filteredLeafCategories.some((item) => item.id === current)) return current;
      return '';
    });
  }, [filteredLeafCategories]);

  useEffect(() => {
    if (filteredLeafCategories.length === 0 && !isLoadingCategories) {
      setError('No active categories are available right now. Please try again shortly.');
    } else if (error.startsWith('No active categories')) {
      setError('');
    }
  }, [filteredLeafCategories.length, error, isLoadingCategories]);

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
    const resolvedTitle = title.trim();
    const resolvedDescription = [
      scope ? `Scope: ${scope}` : '',
      urgency ? `Urgency: ${urgency}` : '',
      targetDate ? `Preferred deadline: ${targetDate}` : '',
      additionalDetails.trim() ? `Details: ${additionalDetails.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    if (!resolvedTitle || !address?.eircode || !address?.county || !address?.locality || !categoryId) {
      setError('Please complete the job title, category, county, city, and Eircode.');
      return;
    }
    if (resolvedTitle.length < 5) {
      setError('Job title must be at least 5 characters.');
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
          description: resolvedDescription || `Job request: ${resolvedTitle}`,
          eircode: address.eircode,
          county: address.county,
          locality: address.locality,
          budget_range: budgetRange,
          // If a specific provider is requested but customer ID is not approved,
          // downgrade to get_quotes so the job enters the pool rather than failing.
          job_mode: urlProviderId && customerIdStatus !== 'approved' ? 'get_quotes' : jobMode,
          task_type: taskType,
          target_provider_id:
            urlProviderId && customerIdStatus === 'approved' ? targetProviderId : null,
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
      trackFunnelStep({
        funnelName: FUNNEL_JOB_POSTING,
        stepName: 'job_posting_submitted',
        stepNumber: 3,
        metadata: { job_id: payload.job.id as string, category_id: categoryId },
      });
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
      if (!title.trim()) return 'Enter a short title for your job.';
      if (title.trim().length < 5) return 'Title must be at least 5 characters.';
      if (!categoryId) return 'Choose a service category to continue.';
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
    const categoryObj = filteredLeafCategories.find((item: Category) => item.id === categoryId);
    if (!title.trim() || !categoryObj) return;

    setIsGeneratingDescription(true);
    try {
      const res = await fetch('/api/ai/job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: title.trim(),
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

  const goToStep = (target: number) => {
    setError('');
    setStep(target);
  };

  const nextFromStep1 = () => {
    const validationError = getStepValidationError(1);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    trackFunnelStep({
      funnelName: FUNNEL_JOB_POSTING,
      stepName: 'description_written',
      stepNumber: 1,
      metadata: { category_id: categoryId, has_details: additionalDetails.trim().length > 0 },
    });
    setStep(2);
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

  /* ── Task type labels ──────────────────────────────────── */
  const taskTypeLabel = (v: TaskType) =>
    v === 'in_person' ? 'In person' : v === 'remote' ? 'Remote' : 'Flexible';

  return (
    <div className={styles.card}>
      <p className={styles.step}>Step {step}/3</p>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>
      <p className={styles.stepDetail}>Progress: {progressPercent}% complete</p>
      {feedback ? <p className={`${styles.feedback} ${styles.ok}`}>{feedback}</p> : null}
      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}

      {/* Provider pre-selection + ID verification status banner */}
      {urlProviderId ? (
        <div
          className="mb-4 rounded-xl border p-3 text-sm"
          style={{
            background: customerIdStatus === 'approved'
              ? 'rgba(var(--wm-primary-rgb), 0.07)'
              : 'rgba(var(--wm-amber-rgb, 245 158 11), 0.09)',
            borderColor: customerIdStatus === 'approved'
              ? 'rgba(var(--wm-primary-rgb), 0.3)'
              : 'var(--wm-amber)',
            color: 'var(--wm-text)',
            fontFamily: 'var(--wm-font-sans)',
          }}
        >
          {providerName ? (
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              Requesting a quote from {providerName}
            </p>
          ) : null}
          {customerIdStatus === 'approved' ? (
            <p style={{ color: 'var(--wm-primary-dark)' }}>
              Your identity is verified — this will be sent as a direct request.
            </p>
          ) : (
            <p style={{ color: 'var(--wm-amber-dark, #92400e)' }}>
              Your identity has not been verified yet. This request will enter the open pool
              so multiple providers can respond. To contact this provider directly,{' '}
              <a href={withLocalePrefix(localeRoot, '/profile?focus=id#identity-verification')} style={{ color: 'var(--wm-primary-dark)', textDecoration: 'underline' }}>
                verify your identity first
              </a>. Verified identity protects both you and the provider.
            </p>
          )}
        </div>
      ) : null}

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
            {/* ── STEP 1: What do you need done? ───────────── */}
            {step === 1 ? (
              <motion.div
                key="step-1"
                className={styles.field}
                initial={STEP_ANIMATION.initial}
                animate={STEP_ANIMATION.animate}
                exit={STEP_ANIMATION.exit}
                transition={STEP_ANIMATION.transition}
              >
                <h2 className={styles.title}>What do you need done?</h2>
                <p className={styles.sectionLead}>Describe your task in a few words and pick a category.</p>

                {/* Title — free text */}
                <label className={styles.field}>
                  <span>Job title</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fix a leaking tap, Paint living room walls, Deep clean 3-bed house"
                    className={styles.input}
                    maxLength={120}
                    autoFocus
                    style={{
                      borderRadius: 'var(--wm-radius-xl)',
                      padding: '13px 16px',
                      fontSize: '1.02rem',
                    }}
                  />
                  {title.trim().length > 0 && title.trim().length < 5 ? (
                    <small style={{ color: 'var(--wm-destructive)', fontSize: '0.82rem' }}>
                      At least 5 characters required
                    </small>
                  ) : null}
                </label>

                {/* Category — searchable grouped dropdown */}
                <div className={styles.field} ref={categoryDropdownRef}>
                  <span>Service category</span>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={styles.select}
                      onClick={() => setCategoryDropdownOpen((v) => !v)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderRadius: 'var(--wm-radius-xl)',
                      }}
                    >
                      <span style={{ color: selectedCategory ? 'var(--wm-text)' : 'var(--wm-muted)' }}>
                        {selectedCategory
                          ? selectedCategory.name
                          : isLoadingCategories
                            ? 'Loading categories...'
                            : 'Select a category'}
                      </span>
                      <ChevronDown
                        style={{
                          width: '1rem',
                          height: '1rem',
                          color: 'var(--wm-muted)',
                          transform: categoryDropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s',
                        }}
                      />
                    </button>

                    {categoryDropdownOpen ? (
                      <div className={styles.categoryDropdown}>
                        {/* Search input */}
                        <div className={styles.categorySearchWrap}>
                          <Search style={{ width: '0.9rem', height: '0.9rem', color: 'var(--wm-muted)', flexShrink: 0 }} />
                          <input
                            type="text"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            placeholder="Search categories..."
                            className={styles.categorySearchInput}
                            autoFocus
                          />
                        </div>
                        {/* Grouped list */}
                        <div className={styles.categoryList}>
                          {searchFilteredGroups.length === 0 ? (
                            <p style={{ padding: '0.75rem', color: 'var(--wm-muted)', fontSize: '0.88rem', margin: 0 }}>
                              No categories match your search.
                            </p>
                          ) : null}
                          {searchFilteredGroups.map((group) => (
                            <div key={group.parentName}>
                              <p className={styles.categoryGroupLabel}>{group.parentName}</p>
                              {group.children.map((cat) => (
                                <button
                                  type="button"
                                  key={cat.id}
                                  className={`${styles.categoryOption} ${categoryId === cat.id ? styles.categoryOptionActive : ''}`}
                                  onClick={() => {
                                    setCategoryId(cat.id);
                                    setCategoryDropdownOpen(false);
                                    setCategorySearch('');
                                    if (cat.id !== trackedCategoryRef.current) {
                                      trackedCategoryRef.current = cat.id;
                                      trackFunnelStep({
                                        funnelName: FUNNEL_JOB_POSTING,
                                        stepName: 'category_selected',
                                        stepNumber: 1,
                                        metadata: { category_id: cat.id },
                                      });
                                    }
                                  }}
                                >
                                  {cat.name}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {categoryNotice ? <small className={styles.muted}>{categoryNotice}</small> : null}
                </div>

                {/* Description + AI write */}
                <div className={styles.field}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span>Description (optional)</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={generateDescription}
                      disabled={isGeneratingDescription || !title.trim() || !categoryId}
                      className={styles.secondary}
                      loading={isGeneratingDescription}
                      style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', whiteSpace: 'nowrap' }}
                    >
                      {isGeneratingDescription ? 'Writing...' : 'AI-write'}
                    </Button>
                  </div>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="Add more detail about the work needed, or tap AI-write to auto-generate."
                    className={styles.textarea}
                    rows={4}
                  />
                </div>

                {/* Posting mode — collapsed by default */}
                <HybridJobPost selectedMode={jobMode} onModeSelect={setJobMode} collapsed />

                {jobMode === 'quick_hire' ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--wm-radius-md)',
                      background: 'var(--wm-amber-light)',
                      border: '1px solid var(--wm-amber)',
                      fontSize: '0.85rem',
                      color: 'var(--wm-amber-dark)',
                      fontWeight: 500,
                    }}
                  >
                    <Zap style={{ width: '0.9rem', height: '0.9rem', flexShrink: 0 }} />
                    <span>This job will be marked <strong>Urgent</strong> and limited to 5 quotes for fast turnaround.</span>
                  </div>
                ) : null}

                {jobMode === 'direct_request' && targetProviderId ? (
                  <p className={styles.notice}>
                    This job will be sent directly to the selected provider. Only they can respond.
                  </p>
                ) : jobMode === 'direct_request' && !targetProviderId ? (
                  <div className={styles.inlineCta}>
                    <p className={styles.muted}>Direct Request needs a provider.</p>
                    <Button
                      variant="secondary"
                      className={styles.secondary}
                      size="sm"
                      onClick={() => router.push(withLocalePrefix(localeRoot, '/providers'))}
                    >
                      Browse providers
                    </Button>
                  </div>
                ) : null}

                <div className={styles.buttonRow}>
                  <Button
                    variant="primary"
                    onClick={nextFromStep1}
                    className={styles.primary}
                    disabled={Boolean(currentStepError)}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            ) : null}

            {/* ── STEP 2: Details and Location ─────────────── */}
            {step === 2 ? (
              <motion.div
                key="step-2"
                className={styles.field}
                initial={STEP_ANIMATION.initial}
                animate={STEP_ANIMATION.animate}
                exit={STEP_ANIMATION.exit}
                transition={STEP_ANIMATION.transition}
              >
                <h2 className={styles.title}>Details and location</h2>
                <p className={styles.sectionLead}>Help providers understand the scope, timing, and where you are.</p>

                {/* Task type pills */}
                <div className={styles.field}>
                  <span>Task type</span>
                  <div className={styles.chipRow}>
                    {(['in_person', 'remote', 'flexible'] as TaskType[]).map((value) => (
                      <Button
                        key={value}
                        variant={taskType === value ? 'primary' : 'ghost'}
                        size="sm"
                        className={`${styles.chip} ${taskType === value ? styles.chipActive : ''}`}
                        onClick={() => setTaskType(value)}
                      >
                        {taskTypeLabel(value)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Scope pills */}
                <div className={styles.field}>
                  <span>Scope</span>
                  <div className={styles.chipRow}>
                    {JOB_SCOPE_OPTIONS.map((item) => (
                      <Button
                        key={item}
                        variant={scope === item ? 'primary' : 'ghost'}
                        size="sm"
                        className={`${styles.chip} ${scope === item ? styles.chipActive : ''}`}
                        onClick={() => setScope(item)}
                      >
                        <span style={{ display: 'grid', gap: '0.1rem', textAlign: 'left' }}>
                          <span>{item.split('(')[0].trim()}</span>
                          <span style={{ fontSize: '0.76rem', fontWeight: 400, opacity: 0.8 }}>
                            {JOB_SCOPE_DESCRIPTIONS[item]}
                          </span>
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Urgency pills */}
                <div className={styles.field}>
                  <span>When do you need this done?</span>
                  <div className={styles.chipRow}>
                    {JOB_URGENCY_OPTIONS.map((item) => (
                      <Button
                        key={item}
                        variant={urgency === item ? 'primary' : 'ghost'}
                        size="sm"
                        className={`${styles.chip} ${urgency === item ? styles.chipActive : ''}`}
                        onClick={() => setUrgency(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Preferred date */}
                <label className={styles.field}>
                  <span>Preferred date (optional)</span>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className={styles.input}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ borderRadius: 'var(--wm-radius-xl)' }}
                  />
                </label>

                {/* Budget */}
                <div className={styles.field}>
                  <span>
                    Budget{' '}
                    <InfoTooltip text="Set an estimated budget. Providers can send custom offers based on scope, urgency, and materials." />
                  </span>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value as (typeof JOB_BUDGET_OPTIONS)[number])}
                    className={styles.select}
                    style={{ borderRadius: 'var(--wm-radius-xl)' }}
                  >
                    {JOB_BUDGET_OPTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  {priceEstimate ? (
                    <p className={styles.muted} style={{ fontSize: '0.85rem' }}>
                      Based on {priceEstimate.sampleSize} accepted jobs in this category: typical range{' '}
                      <strong>
                        &euro;{Math.round(priceEstimate.p25Cents / 100)}&ndash;&euro;{Math.round(priceEstimate.p75Cents / 100)}
                      </strong>{' '}
                      (median &euro;{Math.round(priceEstimate.medianCents / 100)})
                    </p>
                  ) : null}
                </div>

                {/* Location */}
                <div className={styles.field}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin style={{ width: '0.95rem', height: '0.95rem', color: 'var(--wm-primary)' }} />
                    Location
                  </span>
                  <EircodeAddressForm value={address} onChange={setAddress} />
                </div>

                <div className={styles.buttonRow}>
                  <Button variant="secondary" onClick={() => goToStep(1)} className={styles.secondary}>
                    Back
                  </Button>
                  <Button variant="primary" onClick={nextFromStep2} className={styles.primary}>
                    Continue
                  </Button>
                </div>
              </motion.div>
            ) : null}

            {/* ── STEP 3: Review and Submit ────────────────── */}
            {step === 3 ? (
              <motion.div
                key="step-3"
                className={styles.field}
                initial={STEP_ANIMATION.initial}
                animate={STEP_ANIMATION.animate}
                exit={STEP_ANIMATION.exit}
                transition={STEP_ANIMATION.transition}
              >
                <h2 className={styles.title}>Review and submit</h2>
                <p className={styles.sectionLead}>Check the details below, then submit your request.</p>

                {/* Review summary card */}
                <div className={styles.reviewCard}>
                  {/* Title + category */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewSectionHeader}>
                      <span className={styles.reviewSectionTitle}>Job details</span>
                      <button type="button" className={styles.reviewEditBtn} onClick={() => goToStep(1)}>
                        <Pencil style={{ width: '0.8rem', height: '0.8rem' }} /> Edit
                      </button>
                    </div>
                    <div className={styles.reviewGrid}>
                      <div className={styles.reviewItem}>
                        <span className={styles.reviewLabel}>Title</span>
                        <span className={styles.reviewValue}>{title.trim()}</span>
                      </div>
                      <div className={styles.reviewItem}>
                        <span className={styles.reviewLabel}>Category</span>
                        <span className={styles.reviewValue}>{selectedCategory?.name ?? '—'}</span>
                      </div>
                      {additionalDetails.trim() ? (
                        <div className={styles.reviewItem} style={{ gridColumn: '1 / -1' }}>
                          <span className={styles.reviewLabel}>Description</span>
                          <span className={styles.reviewValue} style={{ whiteSpace: 'pre-wrap' }}>
                            {additionalDetails.trim()}
                          </span>
                        </div>
                      ) : null}
                      <div className={styles.reviewItem}>
                        <span className={styles.reviewLabel}>Posting mode</span>
                        <span className={styles.reviewValue} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {jobMode === 'get_quotes' ? 'Get Quotes' : jobMode === 'quick_hire' ? 'Quick Hire' : 'Direct Request'}
                          {jobMode === 'quick_hire' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                padding: '0.1rem 0.4rem',
                                borderRadius: '999px',
                                background: 'var(--wm-amber-light)',
                                color: 'var(--wm-amber-dark)',
                              }}
                            >
                              <Zap style={{ width: '0.6rem', height: '0.6rem' }} />
                              Urgent
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewSectionHeader}>
                      <span className={styles.reviewSectionTitle}>Timing and scope</span>
                      <button type="button" className={styles.reviewEditBtn} onClick={() => goToStep(2)}>
                        <Pencil style={{ width: '0.8rem', height: '0.8rem' }} /> Edit
                      </button>
                    </div>
                    <div className={styles.reviewGrid}>
                      <div className={styles.reviewItem}>
                        <span className={styles.reviewLabel}>Task type</span>
                        <span className={styles.reviewValue}>{taskTypeLabel(taskType)}</span>
                      </div>
                      {scope ? (
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Scope</span>
                          <span className={styles.reviewValue}>{scope}</span>
                        </div>
                      ) : null}
                      {urgency ? (
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>When needed</span>
                          <span className={styles.reviewValue}>{urgency}</span>
                        </div>
                      ) : null}
                      {targetDate ? (
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Preferred date</span>
                          <span className={styles.reviewValue}>{targetDate}</span>
                        </div>
                      ) : null}
                      <div className={styles.reviewItem}>
                        <span className={styles.reviewLabel}>Budget</span>
                        <span className={styles.reviewValue}>{budgetRange}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewSectionHeader}>
                      <span className={styles.reviewSectionTitle}>Location</span>
                      <button type="button" className={styles.reviewEditBtn} onClick={() => goToStep(2)}>
                        <Pencil style={{ width: '0.8rem', height: '0.8rem' }} /> Edit
                      </button>
                    </div>
                    <div className={styles.reviewGrid}>
                      <div className={styles.reviewItem} style={{ gridColumn: '1 / -1' }}>
                        <span className={styles.reviewLabel}>Address</span>
                        <span className={styles.reviewValue}>
                          {[address.address_line_1, address.address_line_2, address.locality, address.county, address.eircode]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photos */}
                <div className={styles.field}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Camera style={{ width: '0.95rem', height: '0.95rem', color: 'var(--wm-primary)' }} />
                    Photos (optional)
                  </span>
                  <p className={styles.muted} style={{ fontSize: '0.85rem', margin: 0 }}>
                    Upload photos to help providers understand the job and quote more accurately.
                  </p>
                  <input
                    className={styles.input}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                    style={{ borderRadius: 'var(--wm-radius-xl)' }}
                  />
                  {photos.length > 0 ? (
                    <p className={styles.muted} style={{ fontSize: '0.85rem', margin: 0 }}>
                      {photos.length} photo{photos.length > 1 ? 's' : ''} selected
                    </p>
                  ) : null}
                </div>

                <div className={styles.buttonRow}>
                  <Button variant="secondary" onClick={() => goToStep(2)} className={styles.secondary}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={submitJob}
                    disabled={isPending || Boolean(currentStepError)}
                    className={styles.primary}
                    loading={isPending}
                  >
                    {isPending ? 'Submitting...' : 'Create Job Request'}
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
