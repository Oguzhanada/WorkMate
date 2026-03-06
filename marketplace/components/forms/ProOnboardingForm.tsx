'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import {
  PROVIDER_DOCUMENT_LABELS,
  PROVIDER_REQUIRED_DOCUMENTS,
  ProviderDocumentDraft,
  ProviderDocumentType,
  validateProviderDocumentDraft,
} from '@/lib/provider-documents';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import ProgressBar from '@/components/ui/ProgressBar';

import styles from './pro-onboarding.module.css';

type ExistingDocument = {
  id: string;
  document_type: string;
  verification_status: string;
  expires_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
};

type Props = {
  profileId: string;
  accountRole?: 'customer' | 'provider';
  existingDocuments?: ExistingDocument[];
  onSubmitted?: () => Promise<void> | void;
};

const DOC_TYPES: ProviderDocumentType[] = [
  'id_verification',
  'safe_pass',
  'public_liability_insurance',
  'tax_clearance',
  'trade_license',
  'other',
];

const CATEGORY_OPTIONS = [
  'Home Cleaning',
  'Plumbing Repair',
  'Electrical Repair',
  'Painting & Decorating',
  'Local Moving',
  'Intercity Moving',
  'Math Tutoring',
  'English Tutoring',
  'Event Planning',
];

function statusFor(docType: string, documents: ExistingDocument[]) {
  const list = documents
    .filter((d) => d.document_type === docType)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const doc = list[0];
  if (!doc) return '• Not uploaded';
  if (doc.verification_status === 'rejected') return `❌ Rejected${doc.rejection_reason ? `: ${doc.rejection_reason}` : ''}`;
  if (doc.verification_status === 'pending') return '⏳ Pending review';
  if (doc.expires_at) {
    const days = Math.ceil((+new Date(doc.expires_at) - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return '⚠️ Expired';
    if (days <= 30) return '⚠️ Expiring soon';
  }
  return '✅ Approved';
}

export default function ProOnboardingForm({
  profileId,
  accountRole = 'provider',
  existingDocuments = [],
  onSubmitted,
}: Props) {
  const [mode, setMode] = useState<'customer' | 'provider'>(accountRole);
  const [draft, setDraft] = useState<ProviderDocumentDraft>({
    type: 'id_verification',
    file: null,
    expiresAt: '',
    coverageAmountEur: '',
    croNumber: '',
    licenseCode: '',
    otherDescription: '',
  });
  const [uploaded, setUploaded] = useState<ExistingDocument[]>(existingDocuments);
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [secondaryCategories, setSecondaryCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  const requiredByMode = useMemo(
    () => (mode === 'provider' ? PROVIDER_REQUIRED_DOCUMENTS : (['id_verification'] as ProviderDocumentType[])),
    [mode]
  );

  const missingRequired = useMemo(
    () =>
      requiredByMode.filter(
        (type) => !uploaded.some((doc) => doc.document_type === type && doc.verification_status !== 'rejected')
      ),
    [requiredByMode, uploaded]
  );

  const uploadDoc = async (doc: ProviderDocumentDraft) => {
    const supabase = getSupabaseBrowserClient();
    const path = `pro-documents/${profileId}/${doc.type}/${Date.now()}-${doc.file?.name ?? 'file'}`;
    const uploadRes = await supabase.storage.from('pro-documents').upload(path, doc.file!, { upsert: false });
    if (uploadRes.error) {
      throw new Error(uploadRes.error.message);
    }

    const insertPayload = {
      profile_id: profileId,
      document_type: doc.type,
      storage_path: path,
      verification_status: 'pending',
      expires_at: doc.expiresAt || null,
      coverage_amount_eur:
        doc.type === 'public_liability_insurance' && doc.coverageAmountEur
          ? Number(doc.coverageAmountEur)
          : null,
      cro_number: doc.type === 'tax_clearance' ? doc.croNumber || null : null,
      trade_license_code: doc.type === 'trade_license' ? doc.licenseCode || null : null,
      document_label: PROVIDER_DOCUMENT_LABELS[doc.type],
      metadata: {
        other_description: doc.type === 'other' ? doc.otherDescription || null : null,
      },
    };

    const { data: row, error: insertError } = await supabase
      .from('pro_documents')
      .insert(insertPayload)
      .select('id,document_type,verification_status,expires_at,rejection_reason,created_at')
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    await fetch('/api/verification/prescreen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, document_id: row.id }),
    });

    return row as ExistingDocument;
  };

  const submitCurrentDocument = async () => {
    setError('');
    setMessage('');

    const validationError = validateProviderDocumentDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPending(true);
    try {
      const inserted = await uploadDoc(draft);
      setUploaded((current) => [inserted, ...current]);
      setMessage(`${PROVIDER_DOCUMENT_LABELS[draft.type]} uploaded and sent for review.`);
      setDraft((current) => ({ ...current, file: null, otherDescription: '' }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Document upload failed.');
    } finally {
      setIsPending(false);
    }
  };

  const submitApplication = async () => {
    setError('');
    setMessage('');
    const supabase = getSupabaseBrowserClient();

    if (mode === 'provider') {
      if (!primaryCategory) {
        setError('Select your primary category.');
        return;
      }
      if (missingRequired.length > 0) {
        setError(`Upload required documents first: ${missingRequired.map((i) => PROVIDER_DOCUMENT_LABELS[i]).join(', ')}`);
        return;
      }
    }

    setIsPending(true);
    const patch = {
      verification_status: 'pending',
      id_verification_status: uploaded.some((d) => d.document_type === 'id_verification') ? 'pending' : 'none',
      stripe_requirements_due: {
        application_status: 'submitted',
        review_type: mode === 'provider' ? 'provider_application' : 'customer_identity_review',
        services_and_skills: {
          primary_category: primaryCategory || null,
          services: [primaryCategory, ...secondaryCategories].filter(Boolean),
        },
      },
    };

    const { error: updateError } = await supabase.from('profiles').update(patch).eq('id', profileId);

    setIsPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Application submitted. Admin will review each document and notify you.');
    await onSubmitted?.();
  };

  return (
    <motion.section
      className={styles.panel}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className={styles.headerRow}>
        <div>
          <h2>Verification onboarding</h2>
          <p>Upload required documents. Provider accounts need professional documents in addition to ID.</p>
        </div>
        <div className={styles.modeTabs}>
          <button
            type="button"
            className={mode === 'customer' ? styles.modeActive : styles.modeBtn}
            onClick={() => setMode('customer')}
          >
            Customer
          </button>
          <button
            type="button"
            className={mode === 'provider' ? styles.modeActive : styles.modeBtn}
            onClick={() => setMode('provider')}
          >
            Provider
          </button>
        </div>
      </div>

      <ProgressBar
        value={requiredByMode.length - missingRequired.length}
        max={requiredByMode.length}
        label="Required documents completed"
        className="mb-4"
      />

      {mode === 'provider' ? (
        <motion.div className={styles.categoryCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label>
            Primary category
            <select value={primaryCategory} onChange={(e) => setPrimaryCategory(e.target.value)}>
              <option value="">Select</option>
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Secondary categories
            <select
              multiple
              value={secondaryCategories}
              onChange={(e) =>
                setSecondaryCategories(Array.from(e.target.selectedOptions).map((option) => option.value))
              }
            >
              {CATEGORY_OPTIONS.filter((item) => item !== primaryCategory).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </motion.div>
      ) : null}

      <motion.div className={styles.uploadCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <label>
          Document type
          <select
            value={draft.type}
            onChange={(e) => setDraft((current) => ({ ...current, type: e.target.value as ProviderDocumentType }))}
          >
            {DOC_TYPES.map((type) => (
              <option key={type} value={type}>{PROVIDER_DOCUMENT_LABELS[type]}</option>
            ))}
          </select>
        </label>

        <label>
          Choose file
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setDraft((current) => ({ ...current, file: e.target.files?.[0] ?? null }))}
          />
        </label>

        {draft.type === 'safe_pass' || draft.type === 'public_liability_insurance' || draft.type === 'tax_clearance' ? (
          <label>
            Expiry date
            <input
              type="date"
              value={draft.expiresAt ?? ''}
              onChange={(e) => setDraft((current) => ({ ...current, expiresAt: e.target.value }))}
            />
          </label>
        ) : null}

        {draft.type === 'public_liability_insurance' ? (
          <label>
            Coverage amount (EUR)
            <input
              type="number"
              min={6500000}
              value={draft.coverageAmountEur ?? ''}
              onChange={(e) => setDraft((current) => ({ ...current, coverageAmountEur: e.target.value }))}
              placeholder="6500000"
            />
          </label>
        ) : null}

        {draft.type === 'tax_clearance' ? (
          <label>
            CRO number
            <input
              value={draft.croNumber ?? ''}
              onChange={(e) => setDraft((current) => ({ ...current, croNumber: e.target.value }))}
              placeholder="CRO12345"
            />
          </label>
        ) : null}

        {draft.type === 'trade_license' ? (
          <label>
            Trade license code
            <input
              value={draft.licenseCode ?? ''}
              onChange={(e) => setDraft((current) => ({ ...current, licenseCode: e.target.value }))}
              placeholder="RECI / RGI / License ID"
            />
          </label>
        ) : null}

        {draft.type === 'other' ? (
          <label>
            Description
            <input
              value={draft.otherDescription ?? ''}
              onChange={(e) => setDraft((current) => ({ ...current, otherDescription: e.target.value }))}
              placeholder="Describe this document"
            />
          </label>
        ) : null}

        <button type="button" className={styles.primary} onClick={submitCurrentDocument} disabled={isPending}>
          {isPending ? 'Uploading...' : 'Upload document'}
        </button>
      </motion.div>

      <div className={styles.statusGrid}>
        {requiredByMode.map((type) => (
          <article key={type} className={styles.statusCard}>
            <h4>{PROVIDER_DOCUMENT_LABELS[type]}</h4>
            <p>{statusFor(type, uploaded)}</p>
          </article>
        ))}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.ok}>{message}</p> : null}

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={submitApplication} disabled={isPending}>
          Submit for admin review
        </button>
      </div>
    </motion.section>
  );
}
