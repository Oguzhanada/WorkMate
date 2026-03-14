import { useEffect, useOptimistic, useState } from 'react';
import type { Application, AuditLog, DashboardStats, Filters } from './admin-applications-types';

export function useApplicationsData(filtersApplied: Filters, onAfterLoad?: () => void) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingApps: 0,
    approvedApps: 0,
    rejectedApps: 0,
    revenue: 0,
    approvalRate: 0,
  });

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

    const resultCount = Array.isArray(payload.applications) ? payload.applications.length : 0;
    setFeedback(
      resultCount > 0
        ? `\u{1F4CA} Filters applied - ${resultCount} results found`
        : '\u{2139}\uFE0F No applications match your filters'
    );
    setApplications(payload.applications ?? []);
    setAuditLogs(payload.audit_logs ?? []);
    onAfterLoad?.();
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/admin/stats', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFeedback(payload.error || 'Stats could not be loaded.');
        return;
      }
      setDashboardStats({
        totalUsers: Number(payload.totalUsers ?? 0),
        pendingApps: Number(payload.pendingApps ?? 0),
        approvedApps: Number(payload.approvedApps ?? 0),
        rejectedApps: Number(payload.rejectedApps ?? 0),
        revenue: Number(payload.revenue ?? 0),
        approvalRate: Number(payload.approvalRate ?? 0),
      });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications(filtersApplied);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadApplications is intentionally excluded to avoid infinite loops
  }, [filtersApplied]);

  useEffect(() => {
    loadStats();
  }, []);

  return {
    applications,
    setApplications,
    auditLogs,
    feedback,
    setFeedback,
    loading,
    statsLoading,
    dashboardStats,
    optimisticApplications,
    applyOptimistic,
    loadApplications,
    loadStats,
  };
}
