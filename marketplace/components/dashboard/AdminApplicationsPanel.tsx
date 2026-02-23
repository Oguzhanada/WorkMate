'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import styles from './dashboard.module.css';

type Application = {
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
  documents: Array<{ document_type: string; created_at: string }>;
};

export default function AdminApplicationsPanel() {
  const locale = useLocale();
  const [applications, setApplications] = useState<Application[]>([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [service, setService] = useState('');
  const [status, setStatus] = useState('pending');

  const loadApplications = async () => {
    setLoading(true);
    const search = new URLSearchParams({
      q,
      city,
      service,
      status,
    });
    const response = await fetch(`/api/admin/provider-applications?${search.toString()}`, { cache: 'no-store' });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedback(payload.error || 'Başvurular alınamadı.');
      return;
    }

    setApplications(payload.applications ?? []);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const review = async (profileId: string, decision: 'approve' | 'reject') => {
    const response = await fetch('/api/admin/provider-applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: profileId,
        decision,
        note: decision === 'approve' ? 'Approved by admin panel' : 'Rejected by admin panel',
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || 'Başvuru güncellenemedi.');
      return;
    }

    setFeedback(decision === 'approve' ? 'Başvuru onaylandı.' : 'Başvuru reddedildi.');
    setApplications((current) => current.filter((item) => item.id !== profileId));
  };

  if (loading) {
    return <p className={styles.meta}>Başvurular yükleniyor...</p>;
  }

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <h2 className={styles.title}>Filtreler</h2>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>Ara (isim/telefon)</span>
            <input className={styles.input} value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Sehir</span>
            <input className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Hizmet</span>
            <input className={styles.input} value={service} onChange={(e) => setService(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Durum</span>
            <select className={styles.input} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">pending</option>
              <option value="verified">verified</option>
              <option value="rejected">rejected</option>
              <option value="all">all</option>
            </select>
          </label>
        </div>
        <div className={styles.buttons}>
          <button type="button" className={styles.primary} onClick={() => loadApplications()}>
            Filtrele
          </button>
        </div>
      </div>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      {applications.length === 0 ? (
        <p className={styles.card}>
          Bekleyen başvuru yok.
        </p>
      ) : null}
      {applications.map((application) => (
        <article key={application.id} className={styles.card}>
          <h2 className={styles.title}>{application.full_name ?? 'İsimsiz kullanıcı'}</h2>
          <p className={styles.meta}>
            Telefon: {application.phone ?? '-'} | Şehir: {application.stripe_requirements_due?.personal_info?.primary_city ?? '-'}
          </p>
          <p className={styles.meta}>
            Hizmetler: {(application.stripe_requirements_due?.services_and_skills?.services ?? []).join(', ') || '-'}
          </p>
          <p className={styles.meta}>
            Deneyim: {application.stripe_requirements_due?.services_and_skills?.experience_range ?? '-'} | Uygunluk:{' '}
            {Array.isArray(application.stripe_requirements_due?.services_and_skills?.availability)
              ? application.stripe_requirements_due?.services_and_skills?.availability?.join(', ')
              : application.stripe_requirements_due?.services_and_skills?.availability ?? '-'}
          </p>
          <p className={styles.meta}>
            Bölgeler: {(application.stripe_requirements_due?.areas_served?.cities ?? []).join(', ') || '-'} | Yarıçap:{' '}
            {application.stripe_requirements_due?.areas_served?.radius ?? '-'}
          </p>
          <p className={styles.desc}>
            Belgeler: {application.documents.length ? application.documents.map((d) => d.document_type).join(', ') : 'Yüklenmedi'}
          </p>
          <div className={styles.buttons}>
            <Link href={`/${locale}/dashboard/admin/applications/${application.id}`} className={styles.secondaryLink}>
              Detay
            </Link>
            <button
              type="button"
              onClick={() => review(application.id, 'approve')}
              className={styles.primary}
            >
              Onayla
            </button>
            <button
              type="button"
              onClick={() => review(application.id, 'reject')}
              className={styles.danger}
            >
              Reddet
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
