
'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useOptimistic, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import styles from './admin-panel.module.css';

type ReviewType = 'provider_application' | 'customer_identity_review' | 'other';

type ProviderPayload = {
  application_status?: string;
  personal_info?: { primary_city?: string };
  services_and_skills?: {
    services?: string[];
    experience_range?: string;
    availability?: string | string[];
  };
  areas_served?: { cities?: string[]; radius?: string };
  admin_review?: {
    decision?: 'approve' | 'reject' | 'request_changes';
    note?: string;
    reviewed_at?: string;
    reviewed_by?: string;
    reviewed_by_email?: string;
  };
};

type Application = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  verification_status: string;
  id_verification_status?: string;
  created_at: string;
  address?: { county?: string | null; locality?: string | null; eircode?: string | null } | null;
  stripe_requirements_due: ProviderPayload | null;
  documents: Array<{
    id?: string;
    document_type: string;
    verification_status?: string;
    preview_url?: string | null;
    created_at: string;
  }>;
  review_type?: ReviewType;
};

type AuditLog = {
  id: string;
  admin_email?: string | null;
  action: string;
  target_type: string;
  target_profile_id?: string | null;
  target_label?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
};

type SortField =
  | 'full_name'
  | 'review_type'
  | 'category'
  | 'county'
  | 'created_at'
  | 'documents'
  | 'verification_status';

type Filters = {
  q: string;
  status: string;
  review_type: string;
  category: string;
  county: string;
  date_range: '7d' | '30d' | '90d' | 'all';
};

const IRISH_COUNTIES = [
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry', 'Donegal', 'Down', 'Dublin', 'Fermanagh',
  'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo',
  'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Tyrone', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
];

const REQUIRED_PROVIDER_DOCS = ['id_verification', 'safe_pass', 'public_liability_insurance', 'tax_clearance_number'];
const OPTIONAL_PROVIDER_DOCS = ['safe_electric', 'reci', 'rgi'];
const REQUIRED_CUSTOMER_DOCS = ['id_verification'];

const DEFAULT_FILTERS: Filters = {
  q: '',
  status: 'pending',
  review_type: 'all',
  category: 'all',
  county: 'all',
  date_range: '7d',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function mapDocLabel(type: string) {
  if (type === 'id_verification') return 'ID uploaded';
  if (type === 'public_liability_insurance') return 'Insurance';
  if (type === 'tax_clearance' || type === 'tax_clearance_number') return 'Tax Clearance Number';
  if (type === 'safe_pass') return 'Safe Pass';
  if (type === 'safe_electric') return 'Safe Electric';
  if (type === 'reci') return 'RECI';
  if (type === 'rgi') return 'RGI';
  return type.replaceAll('_', ' ');
}

function hasDoc(documents: Application['documents'], expectedType: string) {
  if (expectedType === 'tax_clearance_number') {
    return documents.some(
      (doc) => doc.document_type === 'tax_clearance_number' || doc.document_type === 'tax_clearance'
    );
  }
  return documents.some((doc) => doc.document_type === expectedType);
}

function statusClass(status: string) {
  if (status === 'verified') return `${styles.status} ${styles.approved}`;
  if (status === 'rejected') return `${styles.status} ${styles.rejected}`;
  return `${styles.status} ${styles.pending}`;
}

function statusLabel(status: string) {
  if (status === 'verified') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
}

function badgeForRow(app: Application) {
  const required = app.review_type === 'customer_identity_review' ? REQUIRED_CUSTOMER_DOCS : REQUIRED_PROVIDER_DOCS;
  const okCount = required.filter((item) => hasDoc(app.documents, item)).length;
  if (app.verification_status === 'pending' && okCount < required.length) return '⚠️';
  if (new Date(app.created_at).getTime() > Date.now() - 1000 * 60 * 60 * 24) return '🆕';
  return '👍';
}

function isValidIrishEircode(code: string | null | undefined) {
  if (!code) return false;
  return /^[AC-FHKNPRTV-Y][0-9]{2}[\s-]?[0-9AC-FHKNPRTV-Y]{4}$/i.test(code.trim());
}

export default function AdminApplicationsPanel({ adminEmail = 'Admin' }: { adminEmail?: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtersDraft, setFiltersDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersApplied, setFiltersApplied] = useState<Filters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState<'applications' | 'reports' | 'activity'>('applications');
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const router = useRouter();
  const [optimisticApplications, applyOptimistic] = useOptimistic(
    applications,
    (
      current,
      action:
        | { type: 'set_status'; profileId: string; status: string }
        | { type: 'bulk_set_status'; profileIds: string[]; status: string }
    ) => {
      if (action.type === 'set_status') {
        return current.map((item) =>
          item.id === action.profileId ? { ...item, verification_status: action.status } : item
        );
      }
      return current.map((item) =>
        action.profileIds.includes(item.id) ? { ...item, verification_status: action.status } : item
      );
    }
  );

  const loadApplications = async (filters: Filters) => {
    setLoading(true);
    const search = new URLSearchParams(filters);
    const response = await fetch(`/api/admin/provider-applications?${search.toString()}`, { cache: 'no-store' });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedback(payload.error || 'Applications could not be loaded.');
      return;
    }

    setFeedback('');
    setApplications(payload.applications ?? []);
    setAuditLogs(payload.audit_logs ?? []);
    setSelectedIds([]);
    setExpandedId(null);
    setOpenMenuId(null);
    setPage(1);
  };

  useEffect(() => {
    loadApplications(filtersApplied);
  }, [filtersApplied]);

  const serviceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of optimisticApplications) {
      for (const service of item.stripe_requirements_due?.services_and_skills?.services ?? []) {
        set.add(service);
      }
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [optimisticApplications]);

  const stats = useMemo(() => {
    const total = optimisticApplications.length;
    const pending = optimisticApplications.filter((item) => item.verification_status === 'pending').length;
    const approved = optimisticApplications.filter((item) => item.verification_status === 'verified').length;
    const rejected = optimisticApplications.filter((item) => item.verification_status === 'rejected').length;
    const todayPending = optimisticApplications.filter(
      (item) => item.verification_status === 'pending' && new Date(item.created_at).toDateString() === new Date().toDateString()
    ).length;

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const approvedThisWeek = optimisticApplications.filter(
      (item) => item.verification_status === 'verified' && new Date(item.created_at) >= thisWeekStart
    ).length;
    const rejectedThisWeek = optimisticApplications.filter(
      (item) => item.verification_status === 'rejected' && new Date(item.created_at) >= thisWeekStart
    ).length;

    return { total, pending, approved, rejected, todayPending, approvedThisWeek, rejectedThisWeek };
  }, [optimisticApplications]);

  const activities = useMemo(() => {
    return auditLogs.map((log) => ({
      id: log.id,
      at: log.created_at,
      label: `${log.admin_email ?? 'Admin'} ${String(log.action).replaceAll('_', ' ')} ${log.target_label ?? ''}`.trim(),
    }));
  }, [auditLogs]);

  useEffect(() => {
    const onDocumentPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-admin-menu-root=\"true\"]')) return;
      setOpenMenuId(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null);
    };

    document.addEventListener('mousedown', onDocumentPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocumentPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
  const sortedApplications = useMemo(() => {
    const list = [...optimisticApplications];
    list.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      const aCategory = a.stripe_requirements_due?.services_and_skills?.services?.[0] ?? '-';
      const bCategory = b.stripe_requirements_due?.services_and_skills?.services?.[0] ?? '-';
      const aCounty = a.address?.county ?? '-';
      const bCounty = b.address?.county ?? '-';

      if (sortField === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
      }

      if (sortField === 'documents') {
        return (a.documents.length - b.documents.length) * direction;
      }

      if (sortField === 'category') {
        return aCategory.localeCompare(bCategory) * direction;
      }

      if (sortField === 'county') {
        return aCounty.localeCompare(bCounty) * direction;
      }

      const av = String((a as Record<string, unknown>)[sortField] ?? '');
      const bv = String((b as Record<string, unknown>)[sortField] ?? '');
      return av.localeCompare(bv) * direction;
    });
    return list;
  }, [optimisticApplications, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedApplications.length / pageSize));
  const pageItems = sortedApplications.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const runDecision = async (profileId: string, decision: 'approve' | 'reject' | 'request_changes') => {
    const defaultNote =
      decision === 'approve'
        ? 'Approved by admin'
        : decision === 'request_changes'
        ? 'Please update the missing items.'
        : 'Rejected by admin';
    const note = window.prompt('Admin note', defaultNote);
    if (note === null) return;

    const optimisticStatus = decision === 'approve' ? 'verified' : decision === 'reject' ? 'rejected' : 'pending';
    applyOptimistic({ type: 'set_status', profileId, status: optimisticStatus });

    const response = await fetch('/api/admin/provider-applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, decision, note }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || 'Action failed.');
      return;
    }

    setFeedback(decision === 'approve' ? '🎉 Application approved.' : decision === 'reject' ? '⚠️ Application rejected.' : 'Changes requested.');
    await loadApplications(filtersApplied);
  };

  const runBulkDecision = async (decision: 'approve' | 'reject') => {
    if (selectedIds.length === 0) {
      setFeedback('Select at least one record.');
      return;
    }

    const note = window.prompt('Bulk admin note', decision === 'approve' ? 'Approved in bulk' : 'Rejected in bulk');
    if (note === null) return;

    applyOptimistic({
      type: 'bulk_set_status',
      profileIds: selectedIds,
      status: decision === 'approve' ? 'verified' : 'rejected',
    });

    const results = await Promise.allSettled(
      selectedIds.map((profileId) =>
        fetch('/api/admin/provider-applications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: profileId, decision, note }),
        }).then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      )
    );

    const failed = results.filter((item) => item.status === 'fulfilled' && !item.value.ok).length;
    const succeeded = results.length - failed;
    setFeedback(failed > 0 ? `${succeeded} updated, ${failed} failed.` : `${succeeded} applications updated.`);
    await loadApplications(filtersApplied);
  };

  const sendBulkNotice = async () => {
    if (selectedIds.length === 0) {
      setFeedback('Select at least one provider/customer.');
      return;
    }

    const message = window.prompt('Notification message', 'Please update your profile information.');
    if (!message) return;

    const response = await fetch('/api/admin/provider-applications/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_ids: selectedIds, message }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || 'Bulk notification failed.');
      return;
    }

    setFeedback(`Notification sent to ${payload.count} users.`);
  };

  const exportCsv = () => {
    const rows = sortedApplications.map((item) => ({
      name: item.full_name ?? '',
      phone: item.phone ?? '',
      type: item.review_type ?? 'other',
      category: (item.stripe_requirements_due?.services_and_skills?.services ?? []).join('|'),
      county: item.address?.county ?? '',
      created_at: item.created_at,
      status: item.verification_status,
      documents: item.documents.map((doc) => doc.document_type).join('|'),
      id: item.id,
    }));

    const header = Object.keys(rows[0] ?? { name: '', phone: '', type: '', category: '', county: '', created_at: '', status: '', documents: '', id: '' });
    const csv = [
      header.join(','),
      ...rows.map((row) => header.map((key) => `"${String((row as Record<string, string>)[key] ?? '').replaceAll('"', '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pageItems.length) {
      setSelectedIds((current) => current.filter((id) => !pageItems.some((item) => item.id === id)));
      return;
    }

    const next = new Set(selectedIds);
    for (const row of pageItems) next.add(row.id);
    setSelectedIds(Array.from(next));
  };

  const toggleSelect = (profileId: string) => {
    setSelectedIds((current) => (current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId]));
  };

  const runChecklistItem = async (application: Application, documentType: string) => {
    const found =
      documentType === 'tax_clearance_number'
        ? application.documents.find(
            (doc) =>
              doc.id &&
              (doc.document_type === 'tax_clearance_number' || doc.document_type === 'tax_clearance')
          )
        : application.documents.find((doc) => doc.document_type === documentType && doc.id);
    if (!found?.id) {
      setFeedback(`${mapDocLabel(documentType)} is missing. Ask user to upload this document.`);
      return;
    }

    const response = await fetch(`/api/admin/provider-applications/${application.id}/documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: found.id, decision: 'approve', note: `${mapDocLabel(documentType)} verified.` }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || 'Checklist update failed.');
      return;
    }

    setFeedback(`${mapDocLabel(documentType)} marked as verified.`);
    await loadApplications(filtersApplied);
  };

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const reportsData = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const weeklyCount = optimisticApplications.filter((item) => new Date(item.created_at) >= weekStart).length;

    const categoryCount = new Map<string, number>();
    for (const item of optimisticApplications) {
      for (const category of item.stripe_requirements_due?.services_and_skills?.services ?? []) {
        categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);
      }
    }

    const topCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const approved = optimisticApplications.filter((item) => item.verification_status === 'verified').length;
    const rejected = optimisticApplications.filter((item) => item.verification_status === 'rejected').length;
    const ratioBase = Math.max(approved + rejected, 1);

    return {
      weeklyCount,
      topCategories,
      approvedRatio: Math.round((approved / ratioBase) * 100),
      rejectedRatio: Math.round((rejected / ratioBase) * 100),
    };
  }, [optimisticApplications]);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <button type="button" className={`${styles.tabBtn} ${activeTab === 'applications' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('applications')}>
          Applications
        </button>
        <button type="button" className={`${styles.tabBtn} ${activeTab === 'reports' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('reports')}>
          Reports
        </button>
        <button type="button" className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('activity')}>
          Activity Log
        </button>
      </aside>

      <section className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Admin Dashboard 👑</h1>
            <p className={styles.muted}>Manage provider and customer verification in one place.</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.pill}>🔔 {activities.length}</span>
            <span className={styles.pill}>{adminEmail}</span>
            <button type="button" className={styles.logout} onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {feedback ? <p className={styles.card}>{feedback}</p> : null}

        {activeTab === 'reports' ? (
          <section className={styles.card}>
            <h2 className={styles.title}>Reports</h2>
            <div className={styles.statGrid}>
              <div className={styles.stat}><h4>Weekly Applications</h4><strong>{reportsData.weeklyCount}</strong></div>
              <div className={styles.stat}><h4>Approval Ratio</h4><strong>{reportsData.approvedRatio}%</strong></div>
              <div className={styles.stat}><h4>Rejection Ratio</h4><strong>{reportsData.rejectedRatio}%</strong></div>
              <div className={styles.stat}><h4>Top Categories</h4><strong>{reportsData.topCategories.length}</strong></div>
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.panel}>
                <h3>Most Applied Categories</h3>
                {(reportsData.topCategories.length ? reportsData.topCategories : [['No data', 0]]).map(([name, count]) => (
                  <p key={name} className={styles.muted}>{name}: {count}</p>
                ))}
              </div>
              <div className={styles.panel}>
                <h3>Policy Notes</h3>
                <p className={styles.muted}>Use provider checklist for Irish compliance docs: Safe Pass, Insurance, Tax Clearance Number. Optional: RGI, RECI, Safe Electric.</p>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'activity' ? (
          <section className={styles.card}>
            <h2 className={styles.title}>Who Did What, When</h2>
            <div className={styles.activity}>
              {activities.length === 0 ? <p className={styles.muted}>No recorded actions yet.</p> : null}
              {activities.slice(0, 50).map((item) => (
                <article key={item.id} className={styles.activityItem}>🔔 {item.label} ({new Date(item.at).toLocaleString('en-IE')})</article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'applications' ? (
          <>
            <section className={styles.card}>
              <div className={styles.filterGrid}>
                <div className={styles.field}>
                  <label>Search (name/phone/id)</label>
                  <input
                    className={styles.input}
                    value={filtersDraft.q}
                    onChange={(e) => setFiltersDraft((current) => ({ ...current, q: e.target.value }))}
                    placeholder="Search"
                  />
                </div>
                <div className={styles.field}>
                  <label>Application Type</label>
                  <select
                    className={styles.select}
                    value={filtersDraft.review_type}
                    onChange={(e) => setFiltersDraft((current) => ({ ...current, review_type: e.target.value }))}
                  >
                    <option value="all">All</option>
                    <option value="provider_application">Provider</option>
                    <option value="customer_identity_review">Customer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Status</label>
                  <select
                    className={styles.select}
                    value={filtersDraft.status}
                    onChange={(e) => setFiltersDraft((current) => ({ ...current, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Category</label>
                  <select
                    className={styles.select}
                    value={filtersDraft.category}
                    onChange={(e) => setFiltersDraft((current) => ({ ...current, category: e.target.value }))}
                  >
                    {serviceOptions.map((item) => (
                      <option key={item} value={item}>{item === 'all' ? 'All' : item}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>County</label>
                  <select
                    className={styles.select}
                    value={filtersDraft.county}
                    onChange={(e) => setFiltersDraft((current) => ({ ...current, county: e.target.value }))}
                  >
                    <option value="all">All</option>
                    {IRISH_COUNTIES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Date Range</label>
                  <select
                    className={styles.select}
                    value={filtersDraft.date_range}
                    onChange={(e) => setFiltersDraft((current) => ({ ...current, date_range: e.target.value as Filters['date_range'] }))}
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>

              <div className={styles.filterActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={() => setFiltersApplied(filtersDraft)}>
                  Apply filters
                </button>
                <button className={styles.btn} type="button" onClick={() => { setFiltersDraft(DEFAULT_FILTERS); setFiltersApplied(DEFAULT_FILTERS); }}>
                  Reset
                </button>
                <button className={styles.btn} type="button" onClick={exportCsv}>
                  Export CSV
                </button>
              </div>
            </section>

            <section className={styles.statGrid}>
              <article className={styles.stat}><h4>⏳ Pending</h4><strong>{stats.pending}</strong><p className={styles.muted}>+{stats.todayPending} today</p></article>
              <article className={styles.stat}><h4>✅ Approved</h4><strong>{stats.approved}</strong><p className={styles.muted}>This week +{stats.approvedThisWeek}</p></article>
              <article className={styles.stat}><h4>❌ Rejected</h4><strong>{stats.rejected}</strong><p className={styles.muted}>This week +{stats.rejectedThisWeek}</p></article>
              <article className={styles.stat}><h4>📝 Total</h4><strong>{stats.total}</strong><p className={styles.muted}>All applications</p></article>
            </section>

            <section className={styles.card}>
              <div className={styles.filterActions}>
                <label className={styles.muted}>
                  <input
                    type="checkbox"
                    checked={pageItems.length > 0 && pageItems.every((item) => selectedIds.includes(item.id))}
                    onChange={toggleSelectAll}
                  />{' '}
                  Select page
                </label>
                <button type="button" className={`${styles.btn} ${styles.btnApprove}`} onClick={() => runBulkDecision('approve')}>Bulk Approve</button>
                <button type="button" className={`${styles.btn} ${styles.btnReject}`} onClick={() => runBulkDecision('reject')}>Bulk Reject</button>
                <button type="button" className={styles.btn} onClick={sendBulkNotice}>Send Notification</button>
              </div>

              {loading ? <p className={styles.muted}>Loading...</p> : null}

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th></th>
                      <th></th>
                      <th onClick={() => toggleSort('full_name')}>Applicant</th>
                      <th onClick={() => toggleSort('review_type')}>Type</th>
                      <th onClick={() => toggleSort('category')}>Category</th>
                      <th onClick={() => toggleSort('county')}>County</th>
                      <th onClick={() => toggleSort('created_at')}>Date</th>
                      <th onClick={() => toggleSort('documents')}>Documents</th>
                      <th onClick={() => toggleSort('verification_status')}>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((application, index) => {
                      const requiredDocs = application.review_type === 'customer_identity_review' ? REQUIRED_CUSTOMER_DOCS : REQUIRED_PROVIDER_DOCS;
                      const completedRequired = requiredDocs.filter((docType) => hasDoc(application.documents, docType)).length;
                      const services = application.stripe_requirements_due?.services_and_skills?.services ?? [];
                      const county = application.address?.county ?? application.stripe_requirements_due?.personal_info?.primary_city ?? '-';
                      const idPreview = application.documents.find((doc) => doc.document_type === 'id_verification')?.preview_url;

                      return (
                        <Fragment key={application.id}>
                          <tr key={application.id} className={`${index % 2 ? styles.rowAlt : ''} ${styles.rowHover}`}>
                            <td><input type="checkbox" checked={selectedIds.includes(application.id)} onChange={() => toggleSelect(application.id)} /></td>
                            <td>{badgeForRow(application)}</td>
                            <td>
                              <button type="button" className={styles.btn} onClick={() => setExpandedId((current) => (current === application.id ? null : application.id))}>
                                {application.full_name ?? 'Unnamed'}
                              </button>
                              <p className={styles.muted}>{application.id.slice(0, 8)}</p>
                            </td>
                            <td>{application.review_type === 'provider_application' ? 'Provider' : application.review_type === 'customer_identity_review' ? 'Customer' : 'Other'}</td>
                            <td>{services[0] ?? '-'}</td>
                            <td>{county}</td>
                            <td>{formatDate(application.created_at)}</td>
                            <td>
                              <div className={styles.docCell}>
                                <span>✅ {completedRequired}/{requiredDocs.length}</span>
                                {idPreview ? (
                                  <button
                                    type="button"
                                    className={styles.thumbButton}
                                    onClick={() => setPreviewDocUrl(idPreview)}
                                  >
                                    <img src={idPreview} alt="ID preview" className={styles.thumbImage} />
                                  </button>
                                ) : null}
                              </div>
                            </td>
                            <td><span className={statusClass(application.verification_status)}>{statusLabel(application.verification_status)}</span></td>
                            <td>
                              <div className={styles.menuWrap} data-admin-menu-root="true">
                                <button type="button" className={styles.menuBtn} onClick={() => setOpenMenuId((current) => (current === application.id ? null : application.id))}>⋮</button>
                                {openMenuId === application.id ? (
                                  <div className={styles.menu}>
                                    <button type="button" onClick={() => { setExpandedId(application.id); setOpenMenuId(null); }}>View detail</button>
                                    <button type="button" onClick={() => { runDecision(application.id, 'approve'); setOpenMenuId(null); }}>Approve</button>
                                    <button type="button" onClick={() => { runDecision(application.id, 'reject'); setOpenMenuId(null); }}>Reject</button>
                                    <button type="button" onClick={() => { router.push(`/dashboard/admin/applications/${application.id}`); }}>Edit</button>
                                    <button type="button" onClick={async () => {
                                      const message = window.prompt('Message to user', 'Please update missing documents.');
                                      if (!message) return;
                                      await fetch('/api/admin/provider-applications/bulk', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ profile_ids: [application.id], message }),
                                      });
                                      setFeedback('Message sent.');
                                      setOpenMenuId(null);
                                    }}>Send message</button>
                                    <button type="button" onClick={() => { setFeedback(`${application.full_name ?? 'User'} flagged.`); setOpenMenuId(null); }}>Mark ⚠️</button>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                          {expandedId === application.id ? (
                            <tr>
                              <td colSpan={10} className={styles.detail}>
                                <div className={styles.detailGrid}>
                                  <div className={styles.panel}>
                                    <h4>Contact</h4>
                                    <p className={styles.muted}>Phone: {application.phone ?? '-'}</p>
                                    <p className={styles.muted}>Address: {application.address?.locality ?? '-'}, {application.address?.county ?? '-'}</p>
                                    <p className={styles.muted}>Eircode: {application.address?.eircode ?? '-'} {isValidIrishEircode(application.address?.eircode) ? '✅' : '⚠️'}</p>
                                  </div>

                                  <div className={styles.panel}>
                                    <h4>Documents</h4>
                                    <div className={styles.checklist}>
                                      {(application.review_type === 'customer_identity_review' ? REQUIRED_CUSTOMER_DOCS : REQUIRED_PROVIDER_DOCS).map((docType) => {
                                        const doc = docType === 'tax_clearance_number'
                                          ? application.documents.find(
                                              (item) =>
                                                item.document_type === 'tax_clearance_number' ||
                                                item.document_type === 'tax_clearance'
                                            )
                                          : application.documents.find((item) => item.document_type === docType);
                                        const isVerified = doc?.verification_status === 'verified';
                                        const marker = isVerified ? '✅' : doc ? '⏳' : '❌';
                                        return (
                                          <button key={docType} type="button" className={styles.btn} onClick={() => runChecklistItem(application, docType)}>
                                            {marker} {mapDocLabel(docType)}
                                          </button>
                                        );
                                      })}
                                      {OPTIONAL_PROVIDER_DOCS.map((docType) => {
                                        const hasOptional = application.documents.some((item) => item.document_type === docType);
                                        return <p key={docType} className={styles.muted}>{hasOptional ? '✅' : '⬜'} {mapDocLabel(docType)} (optional)</p>;
                                      })}
                                    </div>
                                  </div>

                                  <div className={styles.panel}>
                                    <h4>Business</h4>
                                    <p className={styles.muted}>Category: {(application.stripe_requirements_due?.services_and_skills?.services ?? []).join(', ') || '-'}</p>
                                    <p className={styles.muted}>Experience: {application.stripe_requirements_due?.services_and_skills?.experience_range ?? '-'}</p>
                                    <p className={styles.muted}>Radius: {application.stripe_requirements_due?.areas_served?.radius ?? '-'}</p>
                                  </div>

                                  <div className={styles.panel}>
                                    <h4>Approval History</h4>
                                    {application.stripe_requirements_due?.admin_review?.reviewed_at ? (
                                      <>
                                        <p className={styles.muted}>{formatDate(application.stripe_requirements_due.admin_review.reviewed_at)} - {application.stripe_requirements_due.admin_review.decision}</p>
                                        <p className={styles.muted}>Admin: {application.stripe_requirements_due.admin_review.reviewed_by_email ?? 'Admin'}</p>
                                        <p className={styles.muted}>Note: {application.stripe_requirements_due.admin_review.note ?? '-'}</p>
                                      </>
                                    ) : (
                                      <p className={styles.muted}>{formatDate(application.created_at)} - Submitted</p>
                                    )}
                                  </div>
                                </div>

                                <div className={styles.filterActions}>
                                  <button className={`${styles.btn} ${styles.btnApprove}`} type="button" onClick={() => runDecision(application.id, 'approve')}>✅ Approve</button>
                                  <button className={`${styles.btn} ${styles.btnReject}`} type="button" onClick={() => runDecision(application.id, 'reject')}>❌ Reject</button>
                                  <Link href={`/dashboard/admin/applications/${application.id}`} className={styles.btn}>📝 Edit</Link>
                                  <button className={styles.btn} type="button" onClick={async () => {
                                    const message = window.prompt('Message to user', 'Please update your profile details and documents.');
                                    if (!message) return;
                                    const response = await fetch('/api/admin/provider-applications/bulk', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ profile_ids: [application.id], message }),
                                    });
                                    const payload = await response.json();
                                    if (!response.ok) {
                                      setFeedback(payload.error || 'Message could not be sent.');
                                      return;
                                    }
                                    setFeedback('Message sent successfully.');
                                  }}>💬 Send Message</button>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableCards}>
                {pageItems.map((application) => (
                  <article key={`card-${application.id}`} className={styles.cardRow}>
                    <p><strong>{application.full_name ?? 'Unnamed'}</strong> ({application.review_type ?? 'other'})</p>
                    <p className={styles.muted}>{application.address?.county ?? '-'} • {formatDate(application.created_at)}</p>
                    <p><span className={statusClass(application.verification_status)}>{statusLabel(application.verification_status)}</span></p>
                    <div className={styles.filterActions}>
                      <button className={styles.btn} onClick={() => setExpandedId((current) => (current === application.id ? null : application.id))}>Detail</button>
                      <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => runDecision(application.id, 'approve')}>Approve</button>
                      <button className={`${styles.btn} ${styles.btnReject}`} onClick={() => runDecision(application.id, 'reject')}>Reject</button>
                    </div>
                  </article>
                ))}
              </div>

              <div className={styles.pagination}>
                <div className={styles.pager}>
                  <button className={styles.btn} type="button" onClick={() => setPage((current) => Math.max(1, current - 1))}>{'<'}</button>
                  <span className={styles.pill}>{page}</span>
                  <button className={styles.btn} type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>{'>'}</button>
                </div>
                <p className={styles.muted}>Total {sortedApplications.length} records • {pageSize} per page</p>
                <select className={styles.select} value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </section>

            <aside className={styles.card}>
              <h3>Recent Activities</h3>
              <div className={styles.activity}>
                {activities.slice(0, 5).map((item) => (
                  <article key={`recent-${item.id}`} className={styles.activityItem}>🔔 {item.label}</article>
                ))}
                {activities.length === 0 ? <p className={styles.muted}>No activity yet.</p> : null}
              </div>
            </aside>
          </>
        ) : null}
      </section>

      {previewDocUrl ? (
        <div className={styles.modalOverlay} onClick={() => setPreviewDocUrl(null)}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={() => setPreviewDocUrl(null)}>
              ×
            </button>
            <img src={previewDocUrl} alt="Identity document preview" className={styles.modalImage} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
