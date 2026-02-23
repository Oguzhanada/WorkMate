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
  created_at: string;
  stripe_requirements_due: {
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
      setFeedback(detailPayload.error || 'Detay alınamadı.');
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
      setFeedback(payload.error || 'AI analizi çalıştırılamadı.');
      return;
    }
    setFeedback('Placeholder AI risk analizi tamamlandı.');
    await loadData();
  };

  const review = async (decision: 'approve' | 'reject') => {
    const response = await fetch('/api/admin/provider-applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: profileId,
        decision,
        note: decision === 'approve' ? 'Approved on detail page' : 'Rejected on detail page',
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || 'Başvuru güncellenemedi.');
      return;
    }
    setFeedback(decision === 'approve' ? 'Başvuru onaylandı.' : 'Başvuru reddedildi.');
    await loadData();
  };

  if (loading) return <p className={styles.meta}>Detay yükleniyor...</p>;
  if (!application) return <p className={styles.feedback}>Başvuru bulunamadı.</p>;

  return (
    <div className={styles.stack}>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      <article className={styles.card}>
        <h2 className={styles.title}>{application.full_name ?? 'İsimsiz kullanıcı'}</h2>
        <p className={styles.meta}>Telefon: {application.phone ?? '-'} | Durum: {application.verification_status}</p>
        <p className={styles.meta}>Şehir: {application.stripe_requirements_due?.personal_info?.primary_city ?? '-'}</p>
        <p className={styles.meta}>
          Hizmetler: {(application.stripe_requirements_due?.services_and_skills?.services ?? []).join(', ') || '-'}
        </p>
        <p className={styles.meta}>
          Deneyim: {application.stripe_requirements_due?.services_and_skills?.experience_range ?? '-'}
        </p>
        <p className={styles.meta}>
          Bölgeler: {(application.stripe_requirements_due?.areas_served?.cities ?? []).join(', ') || '-'} | Yarıçap:{' '}
          {application.stripe_requirements_due?.areas_served?.radius ?? '-'}
        </p>
        <div className={styles.buttons}>
          <button type="button" className={styles.primary} onClick={() => review('approve')}>
            Onayla
          </button>
          <button type="button" className={styles.danger} onClick={() => review('reject')}>
            Reddet
          </button>
          <button type="button" className={styles.secondaryLink} onClick={runVerification}>
            AI Risk Analizi Çalıştır
          </button>
        </div>
      </article>

      <section className={styles.card}>
        <h3 className={styles.title}>Belgeler (Signed URL)</h3>
        {documents.length === 0 ? <p className={styles.meta}>Belge yok.</p> : null}
        <div className={styles.stack}>
          {documents.map((doc) => (
            <div key={doc.id} className={styles.card}>
              <p className={styles.meta}>{doc.document_type} | {doc.verification_status}</p>
              <p className={styles.meta}>{doc.storage_path}</p>
              {doc.signed_url ? (
                <a href={doc.signed_url} target="_blank" rel="noreferrer" className={styles.secondaryLink}>
                  Belgeyi Aç
                </a>
              ) : (
                <p className={styles.meta}>Signed URL üretilemedi.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.title}>Verification Checks</h3>
        {(application.checks ?? []).length === 0 ? <p className={styles.meta}>Henüz check kaydı yok.</p> : null}
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
