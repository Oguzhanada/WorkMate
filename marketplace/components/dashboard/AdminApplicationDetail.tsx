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

export default function AdminApplicationDetail({ profileId }: { profileId: string }) {
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

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

  const runVerification = async () => {
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
  };

  const review = async (decision: 'approve' | 'reject' | 'request_changes') => {
    const defaultNote =
      decision === 'approve'
        ? 'Approved on detail page'
        : decision === 'request_changes'
        ? 'Changes requested on detail page'
        : 'Rejected on detail page';
    const note = window.prompt('Add optional review note for applicant:', defaultNote) ?? defaultNote;

    const response = await fetch('/api/admin/provider-applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: profileId,
        decision,
        note,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || 'Application could not be updated.');
      return;
    }
    setFeedback(
      decision === 'approve'
        ? 'Application approved.'
        : decision === 'request_changes'
        ? 'Changes requested.'
        : 'Application rejected.'
    );
    await loadData();
  };

  const reviewDocument = async (
    documentId: string,
    decision: 'approve' | 'reject' | 'request_resubmission'
  ) => {
    const defaultNote =
      decision === 'approve'
        ? 'Document approved'
        : decision === 'request_resubmission'
        ? 'Please upload a clearer or valid document.'
        : 'Document rejected';
    const note = window.prompt('Document review note:', defaultNote) ?? defaultNote;

    const response = await fetch(`/api/admin/provider-applications/${profileId}/documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: documentId,
        decision,
        note,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || 'Document decision could not be saved.');
      return;
    }
    setFeedback(
      decision === 'approve'
        ? 'Document approved.'
        : decision === 'request_resubmission'
        ? 'Resubmission requested.'
        : 'Document rejected.'
    );
    await loadData();
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
            disabled={!canApproveProfile}
            title="Approve only after both required documents are verified"
          >
            Approve
          </button>
          <button type="button" className={styles.secondaryLink} onClick={() => review('request_changes')}>
            Request changes
          </button>
          <button type="button" className={styles.danger} onClick={() => review('reject')}>
            Reject
          </button>
          <button type="button" className={styles.secondaryLink} onClick={runVerification}>
            Run AI risk check
          </button>
        </div>
      </article>

      <section className={styles.card}>
        <h3 className={styles.title}>Documents (Signed URL)</h3>
        {documents.length === 0 ? <p className={styles.meta}>No documents.</p> : null}
        <div className={styles.stack}>
          {documents.map((doc) => (
            <div key={doc.id} className={styles.card}>
              <p className={styles.meta}>
                {doc.document_type === 'public_liability_insurance'
                  ? 'professional_proof'
                  : doc.document_type}{' '}
                | {doc.verification_status}
              </p>
              <p className={styles.meta}>{doc.storage_path}</p>
              {doc.signed_url ? (
                <a href={doc.signed_url} target="_blank" rel="noreferrer" className={styles.secondaryLink}>
                  Open document
                </a>
              ) : (
                <p className={styles.meta}>Signed URL could not be generated.</p>
              )}
              <div className={styles.buttons}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => reviewDocument(doc.id, 'approve')}
                >
                  Approve doc
                </button>
                <button
                  type="button"
                  className={styles.secondaryLink}
                  onClick={() => reviewDocument(doc.id, 'request_resubmission')}
                >
                  Request re-upload
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => reviewDocument(doc.id, 'reject')}
                >
                  Reject doc
                </button>
              </div>
            </div>
          ))}
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
    </div>
  );
}
