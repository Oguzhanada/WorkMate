'use client';

import { useState } from 'react';
import AdminApplicationsPanel from './AdminApplicationsPanel';
import AdminPendingJobsPanel from './AdminPendingJobsPanel';
import styles from './admin-panel.module.css';

export default function AdminDashboardShell({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<'pending_jobs' | 'applications'>('pending_jobs');

  return (
    <div>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'pending_jobs' ? styles.tabActive : ''}`}
          onClick={() => setTab('pending_jobs')}
        >
          Pending Job Reviews
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'applications' ? styles.tabActive : ''}`}
          onClick={() => setTab('applications')}
        >
          Provider Applications
        </button>
      </div>

      {tab === 'pending_jobs' ? <AdminPendingJobsPanel /> : <AdminApplicationsPanel adminEmail={adminEmail} />}
    </div>
  );
}
