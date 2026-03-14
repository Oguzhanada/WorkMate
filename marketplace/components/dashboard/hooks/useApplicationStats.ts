import { useMemo } from 'react';
import type { Application, AuditLog } from './admin-applications-types';

export function useApplicationStats(optimisticApplications: Application[], auditLogs: AuditLog[]) {
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

  return { stats, activities, reportsData };
}
