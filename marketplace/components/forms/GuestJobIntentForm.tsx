'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { JOB_BUDGET_OPTIONS, JOB_SCOPE_OPTIONS, JOB_URGENCY_OPTIONS } from '@/lib/data/budgets';
import { useCategoriesWithFallback, type Category } from '@/lib/hooks/useCategoriesWithFallback';
import EircodeAddressForm, { type Address } from './EircodeAddressForm';
import InfoTooltip from '@/components/ui/InfoTooltip';
import Button from '@/components/ui/Button';
import { TurnstileWidget } from '@/components/cloudflare/TurnstileWidget';
import styles from './forms.module.css';

const STEP_LABELS = ['Title and details', 'Location and budget', 'Email confirmation'] as const;

/* ── Test-data filter for categories ─────────────────────── */
const TEST_CATEGORY_PATTERN = /QA|E2E|test|^\d+$/i;

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

  const sorted = [...groups.values()].sort((a, b) => a.parentName.localeCompare(b.parentName));
  if (ungrouped.length > 0) {
    sorted.push({ parentName: 'Other', children: ungrouped });
  }
  return sorted;
}

export default function GuestJobIntentForm() {
  const [step, setStep] = useState(1);

  /* ── Categories — fetch ALL (parents + leaves) for grouping ── */
  const { categories: leafCategories, isLoading: isLoadingCategories, notice: categoryNotice } = useCategoriesWithFallback({
    leafOnly: true,
  });
  const { categories: allCategories } = useCategoriesWithFallback({ leafOnly: false });

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
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
  const [cfToken, setCfToken] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [intentId, setIntentId] = useState('');
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);

  const handleTurnstileVerify = useCallback((token: string) => setCfToken(token), []);
  const handleTurnstileExpire = useCallback(() => setCfToken(''), []);

  /* ── Filter out test categories and group by parent ─────── */
  const filteredLeafCategories = useMemo(
    () => leafCategories.filter((c) => !TEST_CATEGORY_PATTERN.test(c.name)),
    [leafCategories],
  );
  const grouped = useMemo(
    () => groupCategories(allCategories, leafCategories),
    [allCategories, leafCategories],
  );

  useEffect(() => {
    queueMicrotask(() => {
      if (filteredLeafCategories.length === 0 && !isLoadingCategories) {
        setError('No active categories are available right now. Please try again shortly.');
      } else {
        setError((prev) => (prev.startsWith('No active categories') ? '' : prev));
      }
    });
  }, [filteredLeafCategories.length, isLoadingCategories]);

  const nextFromStep1 = () => {
    if (!title.trim() || title.trim().length < 5) {
      setError('Job title must be at least 5 characters.');
      return;
    }
    if (!categoryId) {
      setError('Please select a service category.');
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
    const trimmedTitle = title.trim();
    const description = [
      `Scope: ${scope}`,
      `Urgency: ${urgency}`,
      details.trim() ? `Details: ${details.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    if (!email.trim() || !trimmedTitle || !description || !address.eircode || !address.county || !address.locality || !categoryId) {
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
        title: trimmedTitle,
        category_id: categoryId,
        description,
        eircode: address.eircode,
        county: address.county,
        locality: address.locality,
        budget_range: budgetRange,
        photo_urls: [],
        cf_turnstile_token: cfToken || undefined,
      }),
    });

    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      if (response.status === 409 || payload.error === 'one_intent_per_email') {
        setIsDuplicateEmail(true);
        return;
      }
      setError(payload.error || 'Draft could not be created.');
      return;
    }

    setIntentId(payload.intent_id);
    setSuccess(
      'Your request was saved. Note: without a verified account, providers may not be able to match your request as accurately — creating an account unlocks better visibility and faster responses.'
    );
  };

  return (
    <div className={styles.card}>
      <p className={styles.step}>Post as a guest — Step {step} of 3</p>
      {isDuplicateEmail ? (
        <div
          className={`${styles.feedback} ${styles.error}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <strong>You already have a pending request with this email.</strong>
          <p style={{ margin: 0 }}>
            Sign in to publish your existing request, or create an account to manage multiple jobs.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <Button variant="primary" href={`/en/login?email=${encodeURIComponent(email.trim().toLowerCase())}`}>
              Sign in
            </Button>
            <Button variant="secondary" href={`/en/sign-up?email=${encodeURIComponent(email.trim().toLowerCase())}`}>
              Create account
            </Button>
          </div>
        </div>
      ) : null}
      {!isDuplicateEmail && error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}
      {success ? <p className={`${styles.feedback} ${styles.ok}`}>{success}</p> : null}
      {process.env.NODE_ENV === 'development' && (
        <p className={styles.muted}>
          DEV: Email verification will be required before publishing listings in production.
        </p>
      )}
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
                <span>In a few words, what do you need done?</span>
                <input
                  type="text"
                  className={styles.input}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Fix a leaking tap, Paint living room walls, Deep clean 3-bed house"
                  minLength={5}
                />
                {title.trim().length > 0 && title.trim().length < 5 ? (
                  <small style={{ color: 'var(--wm-destructive)' }}>At least 5 characters required</small>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>Service category</span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className={styles.select}
                  disabled={isLoadingCategories || filteredLeafCategories.length === 0}
                >
                  <option value="">{isLoadingCategories ? 'Loading categories...' : 'Select a category'}</option>
                  {grouped.map((group) => (
                    <optgroup key={group.parentName} label={group.parentName}>
                      {group.children.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {categoryNotice ? <small className={styles.muted}>{categoryNotice}</small> : null}
              </label>

              <div className={styles.buttonRow}>
                <Button variant="primary" onClick={nextFromStep1}>
                  Continue
                </Button>
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
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="primary" onClick={nextFromStep2}>
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className={styles.field}>
              <h2 className={styles.title}>Email confirmation</h2>
              <p className={styles.sectionLead}>Almost there! Enter your email to publish your request — or sign in for better visibility.</p>
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
              <TurnstileWidget
                onVerify={handleTurnstileVerify}
                onExpire={handleTurnstileExpire}
              />
              <div className={styles.buttonRow}>
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button variant="primary" onClick={onSubmit} loading={isPending} disabled={isPending}>
                  Save Request
                </Button>
              </div>
              {intentId ? (
                <div className={styles.buttonRow}>
                  <Button variant="primary" href={`/sign-up?intent=${intentId}&email=${encodeURIComponent(email.trim().toLowerCase())}`}>
                    Create account and publish listing
                  </Button>
                  <Button variant="secondary" href="/login">
                    Sign in and continue
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
