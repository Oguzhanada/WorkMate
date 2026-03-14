
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PROVIDER_DOCUMENT_LABELS, PROVIDER_REQUIRED_DOCUMENTS } from '@/lib/data/documents';
import AdvancedSearchFilters, { type AdvancedFilters } from '@/components/dashboard/AdvancedSearchFilters';
import styles from './admin-panel.module.css';
import { DEFAULT_FILTERS, type Application, type Filters } from './hooks/admin-applications-types';
import { useApplicationsData } from './hooks/useApplicationsData';
import { useApplicationFilters, useFilteredApplications } from './hooks/useApplicationFilters';
import { useApplicationActions } from './hooks/useApplicationActions';
import { useApplicationStats } from './hooks/useApplicationStats';

/* ── Constants ──────────────────────────────────────────────────────── */

const IRISH_COUNTIES = [
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry', 'Donegal', 'Down', 'Dublin', 'Fermanagh',
  'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo',
  'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Tyrone', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
];

const REQUIRED_PROVIDER_DOCS = PROVIDER_REQUIRED_DOCUMENTS;
const OPTIONAL_PROVIDER_DOCS = ['safe_electric', 'reci', 'rgi'];
const REQUIRED_CUSTOMER_DOCS: string[] = [];

/* ── Pure helper functions ──────────────────────────────────────────── */

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function mapDocLabel(type: string) {
  if (type in PROVIDER_DOCUMENT_LABELS) return PROVIDER_DOCUMENT_LABELS[type as keyof typeof PROVIDER_DOCUMENT_LABELS];
  if (type === 'id_verification') return 'ID uploaded';
  if (type === 'public_liability_insurance') return 'Insurance';
  if (type === 'tax_clearance' || type === 'tax_clearance_number') return 'Tax Clearance Number';
  if (type === 'safe_pass') return 'Safe Pass';
  if (type === 'safe_electric') return 'Safe Electric';
  if (type === 'reci') return 'RECI';
  if (type === 'rgi') return 'RGI';
  return type.replaceAll('_', ' ');
}

function docStatusMarker(
  doc?: { verification_status?: string; expires_at?: string | null } | undefined
) {
  if (!doc) return '\u274C';
  if (doc.verification_status === 'rejected') return '\u274C';
  if (doc.verification_status === 'pending') return '\u23F3';
  if (doc.verification_status === 'verified') {
    if (doc.expires_at) {
      const days = Math.ceil((new Date(doc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days <= 30) return '\u26A0\uFE0F';
    }
    return '\u2705';
  }
  return '\u274C';
}

function hasDoc(documents: Application['documents'], expectedType: string) {
  if (expectedType === 'tax_clearance_number') {
    return documents.some(
      (doc) => doc.document_type === 'tax_clearance_number' || doc.document_type === 'tax_clearance'
    );
  }
  return documents.some((doc) => doc.document_type === expectedType);
}

function findDocument(documents: Application['documents'], expectedType: string) {
  if (expectedType === 'tax_clearance_number') {
    return documents.find(
      (doc) => doc.document_type === 'tax_clearance_number' || doc.document_type === 'tax_clearance'
    );
  }
  return documents.find((doc) => doc.document_type === expectedType);
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
  if (app.verification_status === 'pending' && okCount < required.length) return '\u26A0\uFE0F';
  if (new Date(app.created_at).getTime() > Date.now() - 1000 * 60 * 60 * 24) return '\uD83C\uDD95';
  return '\uD83D\uDC4D';
}

function isValidIrishEircode(code: string | null | undefined) {
  if (!code) return false;
  return /^[AC-FHKNPRTV-Y][0-9]{2}[\s-]?[0-9AC-FHKNPRTV-Y]{4}$/i.test(code.trim());
}

/* ── Component ──────────────────────────────────────────────────────── */

export default function AdminApplicationsPanel({ adminEmail = 'Admin' }: { adminEmail?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const adminBasePath = `/${locale}/dashboard/admin`;
  const [activeTab, setActiveTab] = useState<'applications' | 'reports' | 'activity'>('applications');

  /* Hook 1: Filter/sort state (no data dependency) */
  const {
    filtersDraft, setFiltersDraft,
    filtersApplied, setFiltersApplied,
    sortField, sortDirection,
    page, setPage, pageSize, setPageSize,
    advancedActiveCount,
    toggleSort, applyStatusFilter,
  } = useApplicationFilters();

  /* Ref-based callback so useApplicationsData can reset actions state after load */
  const afterLoadRef = useRef<() => void>(() => {});
  const onAfterLoad = useCallback(() => {
    afterLoadRef.current();
    setPage(1);
  }, [setPage]);

  /* Hook 2: Data fetching (depends on filtersApplied) */
  const {
    feedback, setFeedback, loading, statsLoading, dashboardStats,
    optimisticApplications, applyOptimistic, auditLogs,
    loadApplications, loadStats,
  } = useApplicationsData(filtersApplied, onAfterLoad);

  /* Hook 3: Derived sorted/paginated data (depends on optimistic data + sort state) */
  const {
    serviceOptions, sortedApplications, totalPages, pageItems, exportCsv,
  } = useFilteredApplications(optimisticApplications, sortField, sortDirection, page, setPage, pageSize);

  /* Hook 4: Stats & reports */
  const { activities, reportsData } = useApplicationStats(optimisticApplications, auditLogs);

  /* Hook 5: Selection & action state */
  const actions = useApplicationActions({
    setFeedback,
    applyOptimistic,
    loadApplications,
    loadStats,
    filtersApplied,
    pageItems,
    onAfterReload: () => setPage(1),
  });

  /* Wire the ref so useApplicationsData's onAfterLoad can call actions.resetSelections */
  useEffect(() => {
    afterLoadRef.current = actions.resetSelections;
  }, [actions.resetSelections]);

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  };

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
            <h1 className={styles.title}>Admin Dashboard &#x1F451;</h1>
            <p className={styles.muted}>Manage provider and customer verification in one place.</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.pill}>&#x1F514; {activities.length}</span>
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
                <article key={item.id} className={styles.activityItem}>&#x1F514; {item.label} ({new Date(item.at).toLocaleString('en-IE')})</article>
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
                    <option value="customer_identity_review">Customer</option>
                    <option value="provider_application">Provider</option>
                    <option value="all">All</option>
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
                <button
                  className={styles.btn}
                  type="button"
                  onClick={async () => {
                    await Promise.all([loadApplications(filtersApplied), loadStats()]);
                    setFeedback('\u2705 Data refreshed');
                  }}
                >
                  Refresh
                </button>
              </div>

              <div className="mt-4">
                <AdvancedSearchFilters
                  value={{
                    start_date: filtersDraft.start_date,
                    end_date: filtersDraft.end_date,
                    id_verification_status: filtersDraft.id_verification_status,
                    has_documents: filtersDraft.has_documents,
                    status: filtersDraft.status as AdvancedFilters['status'],
                    county: filtersDraft.county,
                    review_type: filtersDraft.review_type as AdvancedFilters['review_type'],
                  }}
                  onChange={(adv) =>
                    setFiltersDraft((c) => ({
                      ...c,
                      start_date: adv.start_date,
                      end_date: adv.end_date,
                      id_verification_status: adv.id_verification_status,
                      has_documents: adv.has_documents,
                      status: adv.status,
                      county: adv.county,
                      review_type: adv.review_type,
                    }))
                  }
                  onApply={(adv) => {
                    const merged: Filters = {
                      ...filtersDraft,
                      start_date: adv.start_date,
                      end_date: adv.end_date,
                      id_verification_status: adv.id_verification_status,
                      has_documents: adv.has_documents,
                      status: adv.status,
                      county: adv.county,
                      review_type: adv.review_type,
                    };
                    setFiltersDraft(merged);
                    setFiltersApplied(merged);
                  }}
                  onReset={() => {
                    setFiltersDraft((c) => ({
                      ...c,
                      start_date: DEFAULT_FILTERS.start_date,
                      end_date: DEFAULT_FILTERS.end_date,
                      id_verification_status: DEFAULT_FILTERS.id_verification_status,
                      has_documents: DEFAULT_FILTERS.has_documents,
                      status: DEFAULT_FILTERS.status,
                      county: DEFAULT_FILTERS.county,
                      review_type: DEFAULT_FILTERS.review_type,
                    }));
                    setFiltersApplied((c) => ({
                      ...c,
                      start_date: DEFAULT_FILTERS.start_date,
                      end_date: DEFAULT_FILTERS.end_date,
                      id_verification_status: DEFAULT_FILTERS.id_verification_status,
                      has_documents: DEFAULT_FILTERS.has_documents,
                      status: DEFAULT_FILTERS.status,
                      county: DEFAULT_FILTERS.county,
                      review_type: DEFAULT_FILTERS.review_type,
                    }));
                  }}
                  activeCount={advancedActiveCount}
                />
              </div>
            </section>

            <section className={styles.statGrid}>
              <button type="button" className={styles.stat} onClick={() => applyStatusFilter('pending')}>
                <h4>&#x23F3; Pending</h4>
                <strong>{statsLoading ? '...' : dashboardStats.pendingApps}</strong>
                <p className={styles.muted}>Click to filter</p>
              </button>
              <button type="button" className={styles.stat} onClick={() => applyStatusFilter('verified')}>
                <h4>&#x2705; Approved</h4>
                <strong>{statsLoading ? '...' : dashboardStats.approvedApps}</strong>
                <p className={styles.muted}>Click to filter</p>
              </button>
              <button type="button" className={styles.stat} onClick={() => applyStatusFilter('rejected')}>
                <h4>&#x274C; Rejected</h4>
                <strong>{statsLoading ? '...' : dashboardStats.rejectedApps}</strong>
                <p className={styles.muted}>Click to filter</p>
              </button>
              <button type="button" className={styles.stat} onClick={() => applyStatusFilter('all')}>
                <h4>&#x1F4DD; Total</h4>
                <strong>{statsLoading ? '...' : dashboardStats.totalUsers}</strong>
                <p className={styles.muted}>All applications</p>
              </button>
            </section>

            <section className={styles.card}>
              <div className={styles.filterActions}>
                <label className={styles.muted}>
                  <input
                    type="checkbox"
                    checked={pageItems.length > 0 && pageItems.every((item) => actions.selectedIds.includes(item.id))}
                    onChange={actions.toggleSelectAll}
                    disabled={loading}
                  />{' '}
                  Select page
                </label>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnApprove}`}
                  onClick={() => actions.runBulkDecision('approve')}
                  disabled={loading || actions.selectedIds.length === 0 || actions.isActionPending('global:bulk_decision:approve')}
                >
                  Bulk Approve
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnReject}`}
                  onClick={() => actions.runBulkDecision('reject')}
                  disabled={loading || actions.selectedIds.length === 0 || actions.isActionPending('global:bulk_decision:reject')}
                >
                  Bulk Reject
                </button>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={actions.sendBulkNotice}
                  disabled={loading || actions.selectedIds.length === 0 || actions.isActionPending('global:bulk_notice')}
                >
                  Send Notification
                </button>
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
                      const idPreview = findDocument(application.documents, 'id_verification')?.preview_url;
                      const profileBusy = actions.isProfileBusy(application.id);

                      return (
                        <Fragment key={application.id}>
                          <tr key={application.id} className={`${index % 2 ? styles.rowAlt : ''} ${styles.rowHover}`}>
                            <td>
                              <input
                                type="checkbox"
                                checked={actions.selectedIds.includes(application.id)}
                                onChange={() => actions.toggleSelect(application.id)}
                                disabled={profileBusy}
                              />
                            </td>
                            <td>{badgeForRow(application)}</td>
                            <td>
                              <button
                                type="button"
                                className={styles.btn}
                                onClick={() => actions.setExpandedId((current) => (current === application.id ? null : application.id))}
                                disabled={profileBusy}
                              >
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
                                <span>&#x2705; {completedRequired}/{requiredDocs.length}</span>
                                {idPreview ? (
                                  <button
                                    type="button"
                                    className={styles.thumbButton}
                                    onClick={() => actions.setPreviewDocUrl(idPreview)}
                                  >
                                    <Image src={idPreview} alt="ID preview" width={38} height={38} className={styles.thumbImage} />
                                  </button>
                                ) : null}
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={statusClass(application.verification_status)}
                                onClick={() => applyStatusFilter(application.verification_status as Filters['status'])}
                              >
                                {statusLabel(application.verification_status)}
                              </button>
                            </td>
                            <td>
                              <div className={styles.menuWrap} data-admin-menu-root="true">
                                <button
                                  type="button"
                                  className={styles.menuBtn}
                                  onClick={() => actions.setOpenMenuId((current) => (current === application.id ? null : application.id))}
                                  disabled={profileBusy}
                                >
                                  &#x22EE;
                                </button>
                                {actions.openMenuId === application.id ? (
                                  <div className={styles.menu}>
                                    <button type="button" onClick={() => { actions.setExpandedId(application.id); actions.setOpenMenuId(null); }}>View detail</button>
                                    <button type="button" onClick={() => { actions.runDecision(application.id, 'approve'); actions.setOpenMenuId(null); }} disabled={profileBusy}>Approve</button>
                                    <button type="button" onClick={() => { actions.runDecision(application.id, 'reject'); actions.setOpenMenuId(null); }} disabled={profileBusy}>Reject</button>
                                    <button type="button" onClick={() => { router.push(`${adminBasePath}/applications/${application.id}`); }} disabled={profileBusy}>Edit</button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        actions.openActionModal({
                                          kind: 'message',
                                          profileIds: [application.id],
                                          title: `Send Message to ${application.full_name ?? 'User'}`,
                                          submitLabel: 'Send message',
                                          defaultValue: 'Please update missing documents.',
                                        });
                                        actions.setOpenMenuId(null);
                                      }}
                                      disabled={profileBusy}
                                    >
                                      Send message
                                    </button>
                                    <button type="button" onClick={() => { setFeedback(`${application.full_name ?? 'User'} flagged.`); actions.setOpenMenuId(null); }}>Mark &#x26A0;&#xFE0F;</button>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                          {actions.expandedId === application.id ? (
                            <tr>
                              <td colSpan={10} className={styles.detail}>
                                <div className={styles.detailGrid}>
                                  <div className={styles.panel}>
                                    <h4>Contact</h4>
                                    <p className={styles.muted}>Phone: {application.phone ?? '-'}</p>
                                    <p className={styles.muted}>Address: {application.address?.locality ?? '-'}, {application.address?.county ?? '-'}</p>
                                    <p className={styles.muted}>Eircode: {application.address?.eircode ?? '-'} {isValidIrishEircode(application.address?.eircode) ? '&#x2705;' : '&#x26A0;&#xFE0F;'}</p>
                                  </div>

                                  <div className={styles.panel}>
                                    <h4>Documents</h4>
                                    <div className={styles.checklist}>
                                      {(application.review_type === 'customer_identity_review' ? REQUIRED_CUSTOMER_DOCS : REQUIRED_PROVIDER_DOCS).map((docType) => {
                                        const doc = findDocument(application.documents, docType);
                                        const marker = docStatusMarker(doc);
                                        const checklistBusyKey = `profile:${application.id}:checklist:${docType}`;
                                        return (
                                          <div key={docType} className={styles.checkItem}>
                                            <button
                                              type="button"
                                              className={styles.btn}
                                              onClick={() => actions.runChecklistItem(application, docType)}
                                              disabled={actions.isActionPending(checklistBusyKey)}
                                            >
                                              {marker} {mapDocLabel(docType)}
                                            </button>
                                            {doc?.signed_url ? (
                                              <>
                                                <a className={styles.docLink} href={doc.signed_url} target="_blank" rel="noreferrer">Open</a>
                                                <a className={styles.docLink} href={doc.download_url ?? doc.signed_url} target="_blank" rel="noreferrer">Download</a>
                                              </>
                                            ) : (
                                              <span className={styles.muted}>No file</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {OPTIONAL_PROVIDER_DOCS.map((docType) => {
                                        const optionalDoc = findDocument(application.documents, docType);
                                        return (
                                          <div key={docType} className={styles.checkItem}>
                                            <p className={styles.muted}>
                                              {optionalDoc ? '&#x2705;' : '&#x2B1C;'} {mapDocLabel(docType)} (optional)
                                            </p>
                                            {optionalDoc?.signed_url ? (
                                              <>
                                                <a className={styles.docLink} href={optionalDoc.signed_url} target="_blank" rel="noreferrer">Open</a>
                                                <a className={styles.docLink} href={optionalDoc.download_url ?? optionalDoc.signed_url} target="_blank" rel="noreferrer">Download</a>
                                              </>
                                            ) : null}
                                          </div>
                                        );
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
                                  <button className={`${styles.btn} ${styles.btnApprove}`} type="button" onClick={() => actions.runDecision(application.id, 'approve')} disabled={profileBusy}>
                                    &#x2705; Approve
                                  </button>
                                  <button className={`${styles.btn} ${styles.btnReject}`} type="button" onClick={() => actions.runDecision(application.id, 'reject')} disabled={profileBusy}>
                                    &#x274C; Reject
                                  </button>
                                  <button className={styles.btn} type="button" onClick={() => actions.approveAllDocuments(application.id)} disabled={actions.isActionPending(`profile:${application.id}:approve_all_documents`)}>
                                    &#x2705; Approve all docs
                                  </button>
                                  <Link href={`${adminBasePath}/applications/${application.id}`} className={styles.btn}>&#x1F4DD; Edit</Link>
                                  <button
                                    className={styles.btn}
                                    type="button"
                                    onClick={() =>
                                      actions.openActionModal({
                                        kind: 'message',
                                        profileIds: [application.id],
                                        title: `Send Message to ${application.full_name ?? 'User'}`,
                                        submitLabel: 'Send message',
                                        defaultValue: 'Please update your profile details and documents.',
                                      })
                                    }
                                    disabled={actions.isActionPending(`profile:${application.id}:message`)}
                                  >
                                    &#x1F4AC; Send Message
                                  </button>
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
                {pageItems.map((application) => {
                  const profileBusy = actions.isProfileBusy(application.id);
                  return (
                    <article key={`card-${application.id}`} className={styles.cardRow}>
                      <p><strong>{application.full_name ?? 'Unnamed'}</strong> ({application.review_type ?? 'other'})</p>
                      <p className={styles.muted}>{application.address?.county ?? '-'} &#x2022; {formatDate(application.created_at)}</p>
                      <p><span className={statusClass(application.verification_status)}>{statusLabel(application.verification_status)}</span></p>
                      <div className={styles.filterActions}>
                        <button className={styles.btn} onClick={() => actions.setExpandedId((current) => (current === application.id ? null : application.id))} disabled={profileBusy}>Detail</button>
                        <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => actions.runDecision(application.id, 'approve')} disabled={profileBusy}>Approve</button>
                        <button className={`${styles.btn} ${styles.btnReject}`} onClick={() => actions.runDecision(application.id, 'reject')} disabled={profileBusy}>Reject</button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className={styles.pagination}>
                <div className={styles.pager}>
                  <button className={styles.btn} type="button" onClick={() => setPage((current) => Math.max(1, current - 1))}>{'<'}</button>
                  <span className={styles.pill}>{page}</span>
                  <button className={styles.btn} type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>{'>'}</button>
                </div>
                <p className={styles.muted}>Total {sortedApplications.length} records &#x2022; {pageSize} per page</p>
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
                  <article key={`recent-${item.id}`} className={styles.activityItem}>&#x1F514; {item.label}</article>
                ))}
                {activities.length === 0 ? <p className={styles.muted}>No activity yet.</p> : null}
              </div>
            </aside>
          </>
        ) : null}
      </section>

      {actions.actionModal ? (
        <div className={styles.modalOverlay} onClick={() => actions.closeActionModal()}>
          <div className={`${styles.modalCard} ${styles.actionModalCard}`} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={() => actions.closeActionModal()} disabled={actions.submittingModal}>
              &#x00D7;
            </button>
            <h3 className={styles.modalTitle}>{actions.actionModal.title}</h3>
            <p className={styles.muted}>
              {actions.actionModal.kind === 'message'
                ? 'Message will be sent to the selected user(s).'
                : 'This note will be stored in the admin review trail.'}
            </p>
            <textarea
              className={styles.modalTextarea}
              value={actions.actionInput}
              onChange={(event) => actions.setActionInput(event.target.value)}
              rows={4}
              placeholder={actions.actionModal.kind === 'message' ? 'Enter notification message' : 'Enter review note'}
              disabled={actions.submittingModal}
            />
            <div className={styles.filterActions}>
              <button type="button" className={styles.btn} onClick={() => actions.closeActionModal()} disabled={actions.submittingModal}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${actions.actionModal.kind === 'message' ? styles.btnPrimary : styles.btnApprove}`}
                onClick={actions.submitActionModal}
                disabled={actions.submittingModal || !actions.actionInput.trim()}
              >
                {actions.submittingModal ? 'Submitting...' : actions.actionModal.submitLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {actions.previewDocUrl ? (
        <div className={styles.modalOverlay} onClick={() => actions.setPreviewDocUrl(null)}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={() => actions.setPreviewDocUrl(null)}>
              &#x00D7;
            </button>
            <Image src={actions.previewDocUrl} alt="Identity document preview" width={900} height={1200} className={styles.modalImage} style={{ width: '100%', height: 'auto' }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
