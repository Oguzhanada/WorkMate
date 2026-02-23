'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ProOnboardingForm from '@/components/forms/ProOnboardingForm';
import styles from './dashboard.module.css';

type Profile = {
  id: string;
  is_verified: boolean;
  verification_status: string;
};

type JobLead = {
  id: string;
  title: string;
  category: string;
  category_id: string | null;
  description: string;
  eircode: string;
  county: string | null;
  budget_range: string;
  created_at: string;
};

type DraftQuote = {
  amount: string;
  message: string;
};

type Notification = {
  id: string;
  type: string;
  payload: {
    title?: string;
    category?: string;
  };
  created_at: string;
};

export default function ProDashboard({ profileId }: { profileId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leads, setLeads] = useState<JobLead[]>([]);
  const [quotedJobIds, setQuotedJobIds] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, DraftQuote>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [serviceCategoryIds, setServiceCategoryIds] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      const [{ data: profileData }, { data: quoteData }, { data: notificationsData }, { data: proServicesData }, { data: proAreasData }] = await Promise.all([
        supabase.from('profiles').select('id,is_verified,verification_status').eq('id', profileId).single(),
        supabase.from('quotes').select('job_id').eq('pro_id', profileId),
        supabase
          .from('notifications')
          .select('id,type,payload,created_at')
          .eq('user_id', profileId)
          .is('read_at', null)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('pro_services').select('category_id').eq('profile_id', profileId),
        supabase.from('pro_service_areas').select('county').eq('profile_id', profileId),
      ]);

      const categories = (proServicesData ?? []).map((row: { category_id: string }) => row.category_id);
      const counties = (proAreasData ?? []).map((row: { county: string }) => row.county);
      setServiceCategoryIds(categories);
      setServiceAreas(counties);

      let jobsData: JobLead[] | null = [];
      if (categories.length > 0 && counties.length > 0) {
        let jobsQuery = supabase
          .from('jobs')
          .select('id,title,category,category_id,description,eircode,county,budget_range,created_at')
          .eq('status', 'open')
          .in('category_id', categories)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!counties.includes('Ireland-wide')) {
          jobsQuery = jobsQuery.in('county', counties);
        }

        const result = await jobsQuery;
        jobsData = (result.data as JobLead[] | null) ?? [];
      }

      setProfile((profileData as Profile | null) ?? null);
      setLeads((jobsData as JobLead[] | null) ?? []);
      setQuotedJobIds(new Set((quoteData ?? []).map((item: { job_id: string }) => item.job_id)));
      setNotifications((notificationsData as Notification[] | null) ?? []);
    }

    loadDashboardData();
  }, [profileId]);

  const updateDraft = (jobId: string, patch: Partial<DraftQuote>) => {
    setDrafts((current) => ({
      ...current,
      [jobId]: {
        amount: current[jobId]?.amount ?? '35000',
        message: current[jobId]?.message ?? '',
        ...patch,
      },
    }));
  };

  const submitQuote = async (jobId: string) => {
    const amount = Number(drafts[jobId]?.amount ?? 35000);
    const message = drafts[jobId]?.message ?? '';
    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback('Teklif tutarı geçerli olmalı.');
      return;
    }

    setIsSubmitting((current) => ({ ...current, [jobId]: true }));
    setFeedback('');

    const now = new Date();
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        quote_amount_cents: amount,
        message,
        availability_slots: [{ start: start.toISOString(), end: end.toISOString() }],
      }),
    });

    const payload = await response.json();
    setIsSubmitting((current) => ({ ...current, [jobId]: false }));

    if (!response.ok) {
      setFeedback(payload.error || 'Teklif gönderilemedi.');
      return;
    }

    setQuotedJobIds((current) => new Set(current).add(jobId));
    setFeedback('Teklif başarıyla gönderildi.');
  };

  if (!profile?.is_verified) {
    return <ProOnboardingForm profileId={profileId} />;
  }

  return (
    <div className={styles.stack}>
      <h1 className={styles.title}>Pro Dashboard</h1>
      <p className={styles.meta}>
        Sizin için uygun lead'ler burada listelenir. Her ilana tek bir teklif gönderebilirsiniz.
      </p>
      {notifications.length > 0 ? (
        <div className={styles.notice}>
          <p className={styles.title}>Yeni bildirimler</p>
          {notifications.map((notification) => (
            <p key={notification.id} className={styles.meta}>
              {notification.type === 'new_job_lead'
                ? `Yeni iş ilanı: ${notification.payload.title ?? 'İlan'}`
                : 'Yeni bildirim'}
            </p>
          ))}
        </div>
      ) : null}
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      {serviceCategoryIds.length === 0 || serviceAreas.length === 0 ? (
        <p className={styles.meta}>Lead gormek icin once hizmet kategorileri ve county secimlerini tamamla.</p>
      ) : null}
      {leads.length === 0 ? <p className={styles.meta}>Şu anda açık lead bulunmuyor.</p> : null}
      {leads.map((job) => (
        <div key={job.id} className={styles.card}>
          <p className={styles.title}>{job.title}</p>
          <p className={styles.meta}>{job.category} • {job.county ?? '-'} • {job.eircode} • {job.budget_range}</p>
          <p className={styles.desc}>{job.description}</p>
          {quotedJobIds.has(job.id) ? (
            <p className={styles.okTag}>
              Bu iş için teklifiniz gönderildi.
            </p>
          ) : (
            <div className={styles.stack}>
              <input
                type="number"
                min={1}
                className={styles.input}
                placeholder="Teklif tutarı (cent)"
                value={drafts[job.id]?.amount ?? '35000'}
                onChange={(event) => updateDraft(job.id, { amount: event.target.value })}
              />
              <textarea
                className={styles.textarea}
                placeholder="Kısa açıklama (opsiyonel)"
                value={drafts[job.id]?.message ?? ''}
                onChange={(event) => updateDraft(job.id, { message: event.target.value })}
              />
              <div className={styles.buttons}>
              <button
                onClick={() => submitQuote(job.id)}
                disabled={!!isSubmitting[job.id]}
                className={styles.primary}
              >
                {isSubmitting[job.id] ? 'Gönderiliyor...' : 'Teklif Ver'}
              </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
