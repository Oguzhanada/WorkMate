'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ProOnboardingForm from '@/components/forms/ProOnboardingForm';
import JobMessagePanel from '@/components/dashboard/JobMessagePanel';
import ProviderDocumentStatusCards from '@/components/dashboard/ProviderDocumentStatusCards';
import ReleaseReminderButton from '@/components/payments/ReleaseReminderButton';
import AutoReleaseCountdown from '@/components/payments/AutoReleaseCountdown';
import styles from './dashboard.module.css';

type Profile = {
  id: string;
  is_verified: boolean;
  verification_status: string;
  created_at?: string;
};

type JobLead = {
  id: string;
  customer_id: string;
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
  estimatedDuration: string;
  includes: string;
  excludes: string;
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

type ProviderDocument = {
  id: string;
  document_type: string;
  verification_status: string;
  expires_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
};

type CompletedAssignedJob = {
  id: string;
  title: string;
  auto_release_at: string | null;
};

export default function ProDashboard({ profileId }: { profileId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leads, setLeads] = useState<JobLead[]>([]);
  const [quotedJobIds, setQuotedJobIds] = useState<Set<string>>(new Set());
  const [quoteIdByJobId, setQuoteIdByJobId] = useState<Map<string, string>>(new Map());
  const [drafts, setDrafts] = useState<Record<string, DraftQuote>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [serviceCategoryIds, setServiceCategoryIds] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [leadActionsByJob, setLeadActionsByJob] = useState<Map<string, 'saved' | 'hidden' | 'declined'>>(new Map());
  const [leadFilter, setLeadFilter] = useState<'all' | 'saved'>('all');
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [completedAssignedJobs, setCompletedAssignedJobs] = useState<CompletedAssignedJob[]>([]);

  const loadDashboardData = async () => {
    const [
      { data: profileData },
      { data: quoteData },
      { data: notificationsData },
      { data: proServicesData },
      { data: proAreasData },
      { data: leadActionData },
      { data: docsData },
    ] = await Promise.all([
      supabase.from('profiles').select('id,is_verified,verification_status,created_at').eq('id', profileId).single(),
      supabase.from('quotes').select('id,job_id').eq('pro_id', profileId),
      supabase
        .from('notifications')
        .select('id,type,payload,created_at')
        .eq('user_id', profileId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('pro_services').select('category_id').eq('profile_id', profileId),
      supabase.from('pro_service_areas').select('county').eq('profile_id', profileId),
      supabase.from('pro_lead_actions').select('job_id,action').eq('pro_id', profileId),
      supabase
        .from('pro_documents')
        .select('id,document_type,verification_status,expires_at,rejection_reason,created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false }),
    ]);

    const categories = (proServicesData ?? []).map((row: { category_id: string }) => row.category_id);
    const counties = (proAreasData ?? []).map((row: { county: string }) => row.county);
    setServiceCategoryIds(categories);
    setServiceAreas(counties);

    let jobsData: JobLead[] | null = [];
    if (categories.length > 0 && counties.length > 0) {
      let jobsQuery = supabase
        .from('jobs')
        .select('id,customer_id,title,category,category_id,description,eircode,county,budget_range,created_at')
        .eq('status', 'open')
        .eq('review_status', 'approved')
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
    const actionMap = new Map<string, 'saved' | 'hidden' | 'declined'>(
      (leadActionData ?? []).map((item: { job_id: string; action: 'saved' | 'hidden' | 'declined' }) => [item.job_id, item.action])
    );
    setLeadActionsByJob(actionMap);

    const visibleLeads = ((jobsData as JobLead[] | null) ?? []).filter((job) => {
      const action = actionMap.get(job.id);
      return action !== 'hidden' && action !== 'declined';
    });

    setLeads(visibleLeads);
    setQuotedJobIds(new Set((quoteData ?? []).map((item: { job_id: string }) => item.job_id)));
    setQuoteIdByJobId(new Map((quoteData ?? []).map((item: { id: string; job_id: string }) => [item.job_id, item.id])));
    setNotifications((notificationsData as Notification[] | null) ?? []);
    setDocuments((docsData as ProviderDocument[] | null) ?? []);

    const acceptedQuoteIds = (quoteData ?? []).map((row: { id: string }) => row.id);
    if (acceptedQuoteIds.length > 0) {
      const { data: completedRows } = await supabase
        .from('jobs')
        .select('id,title,auto_release_at,accepted_quote_id,status')
        .eq('status', 'completed')
        .in('accepted_quote_id', acceptedQuoteIds)
        .order('created_at', { ascending: false })
        .limit(10);

      setCompletedAssignedJobs(
        (completedRows ?? []).map((item: { id: string; title: string; auto_release_at: string | null }) => ({
          id: item.id,
          title: item.title,
          auto_release_at: item.auto_release_at,
        }))
      );
    } else {
      setCompletedAssignedJobs([]);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [profileId]);

  const markLead = async (jobId: string, action: 'saved' | 'hidden' | 'declined') => {
    const { error } = await supabase
      .from('pro_lead_actions')
      .upsert({
        pro_id: profileId,
        job_id: jobId,
        action,
      }, { onConflict: 'pro_id,job_id' });

    if (error) {
      setFeedback(error.message || 'Lead action could not be saved.');
      return;
    }

    setLeadActionsByJob((current) => new Map(current).set(jobId, action));
    if (action === 'hidden' || action === 'declined') {
      setLeads((current) => current.filter((item) => item.id !== jobId));
    }
  };

  const updateDraft = (jobId: string, patch: Partial<DraftQuote>) => {
    setDrafts((current) => ({
      ...current,
      [jobId]: {
        amount: current[jobId]?.amount ?? '350',
        message: current[jobId]?.message ?? '',
        estimatedDuration: current[jobId]?.estimatedDuration ?? '2-3 hours',
        includes: current[jobId]?.includes ?? 'Materials, labor, cleanup',
        excludes: current[jobId]?.excludes ?? '',
        ...patch,
      },
    }));
  };

  const submitQuote = async (jobId: string) => {
    const amountEur = Number(drafts[jobId]?.amount ?? 350);
    const amount = Math.round(amountEur * 100);
    const message = drafts[jobId]?.message ?? '';
    const estimatedDuration = drafts[jobId]?.estimatedDuration?.trim() ?? '';
    const includes = (drafts[jobId]?.includes ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const excludes = (drafts[jobId]?.excludes ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (!Number.isFinite(amountEur) || amountEur <= 0) {
      setFeedback('Quote amount (EUR) must be valid.');
      return;
    }
    if (!estimatedDuration || includes.length === 0) {
      setFeedback('Estimated duration and at least one included item are required.');
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
        estimated_duration: estimatedDuration,
        includes,
        excludes,
        availability_slots: [{ start: start.toISOString(), end: end.toISOString() }],
      }),
    });

    const payload = await response.json();
    setIsSubmitting((current) => ({ ...current, [jobId]: false }));

    if (!response.ok) {
      setFeedback(payload.error || 'Quote could not be submitted.');
      return;
    }

    setQuotedJobIds((current) => new Set(current).add(jobId));
    setFeedback('Quote submitted successfully.');
  };

  if (!profile?.is_verified) {
    return (
      <div className={styles.stack}>
        <ProviderDocumentStatusCards documents={documents} />
        <ProOnboardingForm
          profileId={profileId}
          accountRole="provider"
          existingDocuments={documents}
          onSubmitted={loadDashboardData}
        />
      </div>
    );
  }

  const createdAt = profile?.created_at ? new Date(profile.created_at).getTime() : Date.now();
  const monthsSinceSignup = Math.floor((Date.now() - createdAt) / (30 * 24 * 60 * 60 * 1000));
  const commissionRate = monthsSinceSignup < 6 ? 0 : 0.07;
  const visibleLeads = leads.filter((job) => {
    if (leadFilter === 'saved') {
      return leadActionsByJob.get(job.id) === 'saved';
    }
    return true;
  });
  const savedCount = Array.from(leadActionsByJob.values()).filter((action) => action === 'saved').length;

  return (
    <div className={styles.stack}>
      <h1 className={styles.title}>Pro Dashboard</h1>
      <p className={styles.meta}>
        Matching leads are listed here. You can submit one quote per listing.
      </p>
      <ProviderDocumentStatusCards documents={documents} />
      {notifications.length > 0 ? (
        <div className={styles.notice}>
          <p className={styles.title}>New notifications</p>
          {notifications.map((notification) => (
            <p key={notification.id} className={styles.meta}>
              {notification.type === 'new_job_lead'
                ? `New job lead: ${notification.payload.title ?? 'Listing'}`
                : 'New notification'}
            </p>
          ))}
        </div>
      ) : null}
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      {completedAssignedJobs.length > 0 ? (
        <div className={styles.card}>
          <p className={styles.title}>Completed jobs awaiting release</p>
          {completedAssignedJobs.map((job) => (
            <div key={job.id} className={styles.card}>
              <p className={styles.meta}>{job.title}</p>
              <AutoReleaseCountdown autoReleaseAt={job.auto_release_at} />
              <ReleaseReminderButton jobId={job.id} />
            </div>
          ))}
        </div>
      ) : null}
      <div className={styles.card}>
        <p className={styles.title}>Commission and Earnings Estimate</p>
        <p className={styles.meta}>
          First 6 months commission: 0%. After that: default {Math.round(commissionRate * 100)}% (target range 5%-10%).
        </p>
        <p className={styles.meta}>
          Active leads: {leads.length} • Submitted quotes: {quotedJobIds.size}
        </p>
        <p className={styles.meta}>
          Submitting quotes is free. Commission is charged only when work is won.
        </p>
        <p className={styles.meta}>
          Payment visibility target: marked as ready in dashboard within 24 hours after completion.
        </p>
      </div>
      <div className={styles.buttons}>
        <button
          className={leadFilter === 'all' ? styles.primary : styles.secondaryLink}
          onClick={() => setLeadFilter('all')}
        >
          All leads
        </button>
        <button
          className={leadFilter === 'saved' ? styles.primary : styles.secondaryLink}
          onClick={() => setLeadFilter('saved')}
        >
          Saved ({savedCount})
        </button>
      </div>
      {serviceCategoryIds.length === 0 || serviceAreas.length === 0 ? (
        <p className={styles.meta}>To receive leads, complete service category and county selections first.</p>
      ) : null}
      {visibleLeads.length === 0 ? <p className={styles.meta}>No open leads for this filter.</p> : null}
      {visibleLeads.map((job) => (
        <div key={job.id} className={styles.card}>
          <p className={styles.title}>{job.title}</p>
          <p className={styles.meta}>{job.category} • {job.county ?? '-'} • {job.eircode} • {job.budget_range}</p>
          {leadActionsByJob.get(job.id) === 'saved' ? <p className={styles.okTag}>Saved</p> : null}
          <p className={styles.desc}>{job.description}</p>
          {quotedJobIds.has(job.id) ? (
            <p className={styles.okTag}>
              Your quote for this job has been submitted.
            </p>
          ) : (
            <div className={styles.stack}>
              <input
                type="number"
                min={1}
                className={styles.input}
                placeholder="Quote amount (EUR)"
                value={drafts[job.id]?.amount ?? '350'}
                onChange={(event) => updateDraft(job.id, { amount: event.target.value })}
              />
              <textarea
                className={styles.textarea}
                placeholder="Short note (optional)"
                value={drafts[job.id]?.message ?? ''}
                onChange={(event) => updateDraft(job.id, { message: event.target.value })}
              />
              <input
                type="text"
                className={styles.input}
                placeholder="Estimated duration (e.g. 2-3 hours)"
                value={drafts[job.id]?.estimatedDuration ?? '2-3 hours'}
                onChange={(event) => updateDraft(job.id, { estimatedDuration: event.target.value })}
              />
              <input
                type="text"
                className={styles.input}
                placeholder="Included items (comma-separated)"
                value={drafts[job.id]?.includes ?? 'Materials, labor, cleanup'}
                onChange={(event) => updateDraft(job.id, { includes: event.target.value })}
              />
              <input
                type="text"
                className={styles.input}
                placeholder="Excluded items (comma-separated, optional)"
                value={drafts[job.id]?.excludes ?? ''}
                onChange={(event) => updateDraft(job.id, { excludes: event.target.value })}
              />
              <div className={styles.buttons}>
              <button
                onClick={() => submitQuote(job.id)}
                disabled={!!isSubmitting[job.id]}
                className={styles.primary}
              >
                {isSubmitting[job.id] ? 'Submitting...' : 'Submit quote'}
              </button>
              <button
                onClick={() => markLead(job.id, 'saved')}
                className={styles.secondaryLink}
              >
                Save
              </button>
              <button
                onClick={() => markLead(job.id, 'declined')}
                className={styles.danger}
              >
                Not suitable
              </button>
              </div>
            </div>
          )}
          <JobMessagePanel jobId={job.id} visibility="public" title="Public comments" />
          {quoteIdByJobId.get(job.id) ? (
            <JobMessagePanel
              jobId={job.id}
              quoteId={quoteIdByJobId.get(job.id)}
              receiverId={job.customer_id}
              visibility="private"
              title="Private chat with customer"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
