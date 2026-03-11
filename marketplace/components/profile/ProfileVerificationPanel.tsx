"use client";

import {useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import InfoTooltip from '@/components/ui/InfoTooltip';
import IdentityMethodSelector from './IdentityMethodSelector';
import StripeIdentityVerification from './StripeIdentityVerification';
import VerificationBadge from './VerificationBadge';

import styles from './profile-verification.module.css';

const ALLOWED_DOC_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];
const REQUEST_TIMEOUT_MS = 20000;

type Props = {
  profileId: string;
  hasIdDocument: boolean;
  hasInsuranceDocument: boolean;
  hasProviderRole: boolean;
  verificationStatus: string;
  idVerificationStatus: 'none' | 'pending' | 'approved' | 'rejected' | string;
  rejectedReason?: string;
  showRedirectHint: boolean;
  autoFocusTarget?: 'id' | 'proof' | null;
  stripeIdentityStatus?: string;
  idVerificationMethod?: 'document_upload' | 'stripe_identity' | string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    const candidate = (error as {message?: unknown}).message;
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function withTimeout(promise: PromiseLike<any>, message: string, timeoutMs = REQUEST_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

export default function ProfileVerificationPanel({
  profileId,
  hasIdDocument: initialHasIdDocument,
  hasInsuranceDocument: initialHasInsuranceDocument,
  hasProviderRole,
  verificationStatus: _verificationStatus,
  idVerificationStatus,
  rejectedReason = '',
  showRedirectHint,
  autoFocusTarget = null,
  stripeIdentityStatus = 'not_started',
  idVerificationMethod = 'document_upload',
}: Props) {
  const router = useRouter();
  const idInputRef = useRef<HTMLInputElement | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);
  const [hasIdDocument, setHasIdDocument] = useState(initialHasIdDocument);
  const [hasInsuranceDocument, setHasInsuranceDocument] = useState(initialHasInsuranceDocument);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [identityConsent, setIdentityConsent] = useState(false);
  const [isDragOverId, setIsDragOverId] = useState(false);
  const [method, setMethod] = useState<'document_upload' | 'stripe_identity'>(
    idVerificationMethod === 'stripe_identity' ? 'stripe_identity' : 'document_upload'
  );

  const idDocumentRequired = hasProviderRole;
  const missing = useMemo(
    () => ({
      idDocument: idDocumentRequired && (!hasIdDocument || idVerificationStatus === 'rejected'),
      insuranceDocument: false
    }),
    [hasIdDocument, idVerificationStatus, idDocumentRequired]
  );

  const uploadDoc = async (file: File, type: 'id_verification' | 'public_liability_insurance') => {
    const supabase = getSupabaseBrowserClient();

    const path =
      type === 'id_verification'
        ? `id-verifications/${profileId}/${Date.now()}-${file.name}`
        : `pro-documents/${profileId}/${Date.now()}-${file.name}`;
    const {error: uploadError} = await withTimeout(
      supabase.storage.from('pro-documents').upload(path, file, {upsert: false}),
      'Document upload timed out.'
    );
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const {error: docError} = await withTimeout(
      supabase.from('pro_documents').insert({
        profile_id: profileId,
        document_type: type,
        storage_path: path,
        verification_status: 'pending'
      }),
      'Saving document record timed out.'
    );
    if (docError) throw new Error(`Document record failed: ${docError.message}`);

    if (type === 'id_verification') {
      const { error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .update({
            id_verification_status: 'pending',
            id_verification_document_url: path,
            id_verification_submitted_at: new Date().toISOString(),
            id_verification_rejected_reason: null,
            id_verification_reviewed_at: null,
            id_verification_reviewed_by: null,
          })
          .eq('id', profileId),
        'Updating identity status timed out.'
      );

      if (profileError) throw new Error(`Identity profile update failed: ${profileError.message}`);
    }
  };

  const ensureAllowedFile = (file: File | null, kind: 'ID' | 'insurance') => {
    if (!file) return null;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
      return `${kind} document must be PDF, PNG, JPG or JPEG.`;
    }
    if (file.size > 5 * 1024 * 1024) {
      return `${kind} document must be 5MB or smaller.`;
    }
    return null;
  };

  const uploadMissingDocuments = async () => {
    setError('');
    setMessage('');

    if (missing.idDocument && !idFile) {
      setError('ID document is required first. Please select your ID file to continue.');
      return;
    }
    if (idFile && !identityConsent) {
      setError('Please confirm identity processing consent before upload.');
      return;
    }
    if (missing.insuranceDocument && !insuranceFile) {
      setError('Please choose an insurance document file.');
      return;
    }

    const idTypeError = ensureAllowedFile(idFile, 'ID');
    if (idTypeError) {
      setError(idTypeError);
      return;
    }

    const insuranceTypeError = ensureAllowedFile(insuranceFile, 'insurance');
    if (insuranceTypeError) {
      setError(insuranceTypeError);
      return;
    }

    setIsUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      await withTimeout(
        supabase
          .from('profiles')
          .update({id_verification_method: method})
          .eq('id', profileId),
        'Saving verification method timed out.'
      );

      let uploadedSomething = false;
      if (idFile) {
        await uploadDoc(idFile, 'id_verification');
        setHasIdDocument(true);
        uploadedSomething = true;
      }
      if (insuranceFile) {
        await uploadDoc(insuranceFile, 'public_liability_insurance');
        setHasInsuranceDocument(true);
        uploadedSomething = true;
      }

      if (uploadedSomething) {
        const {error: profileUpdateError} = await withTimeout(
          supabase
            .from('profiles')
            .update({verification_status: 'pending', is_verified: false})
            .eq('id', profileId),
          'Updating profile status timed out.'
        );

        if (profileUpdateError) {
          throw new Error(`Profile status update failed: ${profileUpdateError.message}`);
        }
      }

      setIdFile(null);
      setInsuranceFile(null);
      setMessage('Documents uploaded. Identity review is now pending admin approval.');
      router.refresh();
    } catch (uploadError) {
      const messageText = getErrorMessage(uploadError, 'Document upload failed.');
      setError(messageText);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (autoFocusTarget === 'id') {
      idInputRef.current?.focus();
    }
    if (autoFocusTarget === 'proof') {
      proofInputRef.current?.focus();
    }
  }, [autoFocusTarget]);

  return (
    <article id="identity-verification" className={styles.panel}>
      <h2>Identity verification</h2>
      {showRedirectHint ? (
        <p className={styles.error}>
          Please verify your identity first. Add missing profile info and upload your document below.
        </p>
      ) : null}

      <div className={styles.statusRow}>
        <span className={styles.hint}>Status</span>
        <span
          className={`${styles.statusBadge} ${
            idVerificationStatus === 'approved' ? styles.statusOk : styles.statusBad
          }`}
        >
          {idVerificationStatus || 'none'}
        </span>
        <VerificationBadge
          idVerificationMethod={method}
          stripeIdentityStatus={stripeIdentityStatus}
        />
      </div>
      {idVerificationStatus === 'approved' ? (
        <p className={styles.ok}>Your identity has been verified.</p>
      ) : null}
      {idVerificationStatus === 'pending' ? (
        <p className={styles.hint}>
          Your identity verification is pending. An admin will review your submission shortly.
        </p>
      ) : null}
      {idVerificationStatus === 'rejected' ? (
        <p className={styles.error}>
          Identity verification was rejected{rejectedReason ? `: ${rejectedReason}` : '.'} Please upload a clearer valid document.
        </p>
      ) : null}
      <p className={styles.hint}>Use the profile section above to update your full name and phone.</p>
      <IdentityMethodSelector value={method} onChange={setMethod} />
      {method === 'stripe_identity' ? (
        <StripeIdentityVerification stripeIdentityStatus={stripeIdentityStatus} />
      ) : null}

      <p className={missing.idDocument || missing.insuranceDocument ? styles.missing : styles.ok}>
        {missing.idDocument || missing.insuranceDocument
          ? 'Missing verification document(s)'
          : idDocumentRequired
            ? 'ID is required. Additional documents are optional and can improve trust level and matching.'
            : hasIdDocument
              ? 'Identity document uploaded (optional)'
              : 'Identity document is optional for customers'}
      </p>
      <div className={styles.fileRow}>
        <p className={styles.hint}>Supported file types: PDF, PNG, JPG, JPEG.</p>
        {method === 'document_upload' && (missing.idDocument || !idDocumentRequired) ? (
          <div className={styles.uploadBox}>
            <label className={styles.field}>
              <span>
                ID document ({idDocumentRequired ? 'required' : 'optional'}){' '}
                <InfoTooltip text="Your ID will be reviewed by admin before verification is completed." />
              </span>
              <small className={styles.hint}>Note: Your ID document will be reviewed by admin.</small>
              <div className={styles.uploadInner}>
                <span className={styles.uploadIcon}>☁️</span>
                <input
                  ref={idInputRef}
                  className={styles.fileInput}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(event) => setIdFile(event.target.files?.[0] ?? null)}
                />
              </div>
              <div
                className={`${styles.dragArea} ${isDragOverId ? styles.dragAreaActive : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverId(true);
                }}
                onDragLeave={() => setIsDragOverId(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverId(false);
                  const dropped = event.dataTransfer.files?.[0] ?? null;
                  if (dropped) setIdFile(dropped);
                }}
              >
                Drag & drop ID file here or use file picker.
              </div>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={identityConsent}
                  onChange={(event) => setIdentityConsent(event.target.checked)}
                />
                <span>
                  I consent to the processing of my identity documents for verification purposes under{' '}
                  <Link href="/privacy-policy">WorkMate Privacy Policy</Link>.
                </span>
              </label>
            </label>
          </div>
        ) : null}

        {method === 'document_upload' && hasProviderRole && !hasInsuranceDocument ? (
          <div className={styles.uploadBox}>
            <label className={styles.field}>
              <span>Insurance document (optional boost for providers)</span>
              <small className={styles.hint}>
                Optional: uploading professional documents can increase reliability signals and job matching priority.
              </small>
              <div className={styles.uploadInner}>
                <span className={styles.uploadIcon}>☁️</span>
                <input
                  ref={proofInputRef}
                  className={styles.fileInput}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(event) => setInsuranceFile(event.target.files?.[0] ?? null)}
                />
              </div>
            </label>
          </div>
        ) : null}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={uploadMissingDocuments}
          disabled={
            method !== 'document_upload' ||
            isUploading ||
            (!idFile && !insuranceFile)
          }
        >
          {isUploading ? 'Uploading...' : 'Upload selected documents'}
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.toast}>{message}</p> : null}
    </article>
  );
}
