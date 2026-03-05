'use client';

import { useEffect, useState } from 'react';
import styles from './dashboard.module.css';

type Check = {
  id: string;
  provider: string;
  status: string;
  risk_level: string;
  risk_score: number;
  summary: string | null;
  created_at: string;
};

type DocumentRow = {
  id: string;
  document_type: string;
  storage_path: string;
  verification_status: string;
  created_at: string;
  signed_url?: string | null;
  download_url?: string | null;
};

type ApplicationDetail = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  verification_status: string;
  id_verification_method?: string | null;
  stripe_identity_status?: string | null;
  created_at: string;
  stripe_requirements_due: {
    application_status?: string;
    personal_info?: { primary_city?: string };
    services_and_skills?: { services?: string[]; experience_range?: string; availability?: string | string[] };
    areas_served?: { cities?: string[]; radius?: string };
  } | null;
  documents: DocumentRow[];
  checks: Check[];
};

type ReviewDecision = 'approve' | 'reject' | 'request_changes';
type DocumentDecision = 'approve' | 'reject' | 'request_resubmission';

type ReviewModalState =
  | {
      kind: 'application';
      decision: ReviewDecision;
      title: string;
      submitLabel: string;
      defaultValue: string;
    }
  | {
      kind: 'document';
      documentId: string;
      decision: DocumentDecision;
      title: string;
      submitLabel: string;
      defaultValue: string;
    };

export default function AdminApplicationDetail({ profileId }: { profileId: string }) {
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<ReviewModalState | null>(null);
  const [reviewInput, setReviewInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    const [detailRes, docsRes] = await Promise.all([
      fetch(`/api/admin/provider-applications/${profileId}`, { cache: 'no-store' }),
      fetch(`/api/admin/provider-applications/${profileId}/documents`, { cache: 'no-store' }),
    ]);

    const detailPayload = await detailRes.json();
    const docsPayload = await docsRes.json();
    setLoading(false);

    if (!detailRes.ok) {
      setFeedback(detailPayload.error || 'Details could not be loaded.');
      return;
    }

    setApplication(detailPayload.application ?? null);
    setDocuments(docsPayload.documents ?? []);
  };

  useEffect(() => {
    loadData();
  }, [profileId]);

  const setPendingAction = (key: string, pending: boolean) => {
    setPendingActions((current) => {
      if (pending) return { ...current, [key]: true };
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const isActionPending = (key: string) => Boolean(pendingActions[key]);

  const openReviewModal = (nextModal: ReviewModalState) => {
    setReviewModal(nextModal);
    setReviewInput(nextModal.defaultValue);
  };

  const closeReviewModal = (force = false) => {
    if (!force && submittingReview) return;
    setReviewModal(null);
    setReviewInput('');
  };

  const runVerification = async () => {
    const actionKey = 'verification';
    setPendingAction(actionKey, true);
    try {
      const response = await fetch('/api/admin/verification/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error || 'AI verification run failed.');
        return;
      }
      setFeedback('Placeholder AI risk check completed.');
      await loadData();
    } finally {
      setPendingAction(actionKey, false);
    }
  };

  const review = (decision: ReviewDecision) => {
    const defaultValue =
      decision === 'approve'
        ? 'Approved on detail page'
        : decision === 'request_changes'
        ? 'Changes requested on detail page'
        : 'Rejected on detail page';
    openReviewModal({
      kind: 'application',
      decision,
      title: decision === 'approve' ? 'Approve Application' : decision === 'reject' ? 'Reject Application' : 'Request Changes',
      submitLabel: decision === 'approve' ? 'Approve' : decision === 'reject' ? 'Reject' : 'Request changes',
      defaultValue,
    });
  };

  const reviewDocument = (documentId: string, decision: DocumentDecision) => {
    const defaultValue =
      decision === 'approve'
        ? 'Document approved'
        : decision === 'request_resubmission'
        ? 'Please upload a clearer or valid document.'
        : 'Document rejected';
    openReviewModal({
      kind: 'document',
      documentId,
      decision,
      title:
        decision === 'approve'
          ? 'Approve Document'
          : decision === 'request_resubmission'
          ? 'Request Re-upload'
          : 'Reject Document',
      submitLabel:
        decision === 'approve'
          ? 'Approve document'
          : decision === 'request_resubmission'
          ? 'Request re-upload'
          : 'Reject document',
      defaultValue,
    });
  };

  const submitReviewModal = async () => {
    if (!reviewModal) return;

    const note = reviewInput.trim();
    if (!note) {
      setFeedback('Review note is required.');
      return;
    }

    const actionKey =
      reviewModal.kind === 'application'
        ? `application:${reviewModal.decision}`
        : `document:${reviewModal.documentId}:${reviewModal.decision}`;

    setSubmittingReview(true);
    setPendingAction(actionKey, true);

    try {
      if (reviewModal.kind === 'application') {
        const response = await fetch('/api/admin/provider-applications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_id: profileId,
            decision: reviewModal.decision,
            note,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          setFeedback(payload.error || 'Application could not be updated.');
          return;
        }
        setFeedback(
          reviewModal.decision === 'approve'
            ? 'Application approved.'
            : reviewModal.decision === 'request_changes'
            ? 'Changes requested.'
            : 'Application rejected.'
        );
        closeReviewModal(true);
        await loadData();
        return;
      }

      const response = await fetch(`/api/admin/provider-applications/${profileId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: reviewModal.documentId,
          decision: reviewModal.decision,
          note,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error || 'Document decision could not be saved.');
        return;
      }
      setFeedback(
        reviewModal.decision === 'approve'
          ? 'Document approved.'
          : reviewModal.decision === 'request_resubmission'
          ? 'Resubmission requested.'
          : 'Document rejected.'
      );
      closeReviewModal(true);
      await loadData();
    } finally {
      setSubmittingReview(false);
      setPendingAction(actionKey, false);
    }
  };

  if (loading) return <p className={styles.meta}>Loading details...</p>;
  if (!application) return <p className={styles.feedback}>Application not found.</p>;
  const hasVerifiedId = documents.some(
    (doc) => doc.document_type === 'id_verification' && doc.verification_status === 'verified'
  );
  const hasVerifiedProof = documents.some(
    (doc) =>
      doc.document_type === 'public_liability_insurance' && doc.verification_status === 'verified'
  );
  const isProviderApplication = application.stripe_requirements_due?.application_status === 'submitted';
  const canApproveProfile = isProviderApplication ? hasVerifiedId && hasVerifiedProof : hasVerifiedId;
  const profileActionPending =
    isActionPending('application:approve') ||
    isActionPending('application:request_changes') ||
    isActionPending('application:reject');
  const verificationPending = isActionPending('verification');

  return (
    <div className={styles.stack}>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      <article className={styles.card}>
        <h2 className={styles.title}>{application.full_name ?? 'Unnamed user'}</h2>
        <p className={styles.notice}>
          {isProviderApplication ? 'Provider application' : 'Customer identity review'}
        </p>
        <p className={styles.meta}>Phone: {application.phone ?? '-'} | Status: {application.verification_status}</p>
        <p className={styles.meta}>
          Identity method: {application.id_verification_method ?? 'document_upload'}{' '}
          {application.id_verification_method === 'stripe_identity' && application.stripe_identity_status === 'verified'
            ? '• Stripe Verified'
            : ''}
        </p>
        <p className={styles.meta}>City: {application.stripe_requirements_due?.personal_info?.primary_city ?? '-'}</p>
        <p className={styles.meta}>
          Services: {(application.stripe_requirements_due?.services_and_skills?.services ?? []).join(', ') || '-'}
        </p>
        <p className={styles.meta}>
          Experience: {application.stripe_requirements_due?.services_and_skills?.experience_range ?? '-'}
        </p>
        <p className={styles.meta}>
          Service areas: {(application.stripe_requirements_due?.areas_served?.cities ?? []).join(', ') || '-'} | Radius:{' '}
          {application.stripe_requirements_due?.areas_served?.radius ?? '-'}
        </p>
        <p className={canApproveProfile ? styles.okTag : styles.notice}>
          Checklist: Verified ID {hasVerifiedId ? 'OK' : 'MISSING'} | Verified professional proof{' '}
          {isProviderApplication ? (hasVerifiedProof ? 'OK' : 'MISSING') : 'OPTIONAL'}
        </p>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => review('approve')}
            disabled={!canApproveProfile || profileActionPending}
            title="Approve only after both required documents are verified"
          >
            Approve
          </button>
          <button type="button" className={styles.secondaryLink} onClick={() => review('request_changes')} disabled={profileActionPending}>
            Request changes
          </button>
          <button type="button" className={styles.danger} onClick={() => review('reject')} disabled={profileActionPending}>
            Reject
          </button>
          <button type="button" className={styles.secondaryLink} onClick={runVerification} disabled={verificationPending}>
            Run AI risk check
          </button>
        </div>
      </article>

      <section className={styles.card}>
        <h3 className={styles.title}>Documents (Signed URL)</h3>
        {documents.length === 0 ? <p className={styles.meta}>No documents.</p> : null}
        <div className={styles.stack}>
          {documents.map((doc) => {
            const docBusy =
              isActionPending(`document:${doc.id}:approve`) ||
              isActionPending(`document:${doc.id}:request_resubmission`) ||
              isActionPending(`document:${doc.id}:reject`);

            return (
              <div key={doc.id} className={styles.card}>
                <p className={styles.meta}>
                  {doc.document_type === 'public_liability_insurance'
                    ? 'professional_proof'
                    : doc.document_type}{' '}
                  | {doc.verification_status}
                </p>
                <p className={styles.meta}>{doc.storage_path}</p>
                {doc.signed_url ? (
                  <div className={styles.buttons}>
                    <a href={doc.signed_url} target="_blank" rel="noreferrer" className={styles.secondaryLink}>
                      Open document
                    </a>
                    <a
                      href={doc.download_url ?? doc.signed_url}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.secondaryLink}
                    >
                      Download
                    </a>
                  </div>
                ) : (
                  <p className={styles.meta}>Signed URL could not be generated.</p>
                )}
                <div className={styles.buttons}>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() => reviewDocument(doc.id, 'approve')}
                    disabled={docBusy}
                  >
                    Approve doc
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryLink}
                    onClick={() => reviewDocument(doc.id, 'request_resubmission')}
                    disabled={docBusy}
                  >
                    Request re-upload
                  </button>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => reviewDocument(doc.id, 'reject')}
                    disabled={docBusy}
                  >
                    Reject doc
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.title}>Verification Checks</h3>
        {(application.checks ?? []).length === 0 ? <p className={styles.meta}>No verification checks yet.</p> : null}
        <div className={styles.stack}>
          {(application.checks ?? []).map((check) => (
            <div key={check.id} className={styles.card}>
              <p className={styles.meta}>
                {check.provider} | {check.status} | {check.risk_level} ({check.risk_score})
              </p>
              <p className={styles.desc}>{check.summary ?? '-'}</p>
            </div>
          ))}
        </div>
      </section>

      {reviewModal ? (
        <div className={styles.modalOverlay} onClick={() => closeReviewModal()}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <h3 className={styles.title}>{reviewModal.title}</h3>
            <p className={styles.meta}>This note will be saved in the admin audit trail.</p>
            <textarea
              className={styles.textarea}
              value={reviewInput}
              onChange={(event) => setReviewInput(event.target.value)}
              rows={4}
              disabled={submittingReview}
              placeholder="Add review note"
            />
            <div className={styles.buttons}>
              <button type="button" className={styles.secondaryLink} onClick={() => closeReviewModal()} disabled={submittingReview}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={submitReviewModal}
                disabled={submittingReview || !reviewInput.trim()}
              >
                {submittingReview ? 'Submitting...' : reviewModal.submitLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
