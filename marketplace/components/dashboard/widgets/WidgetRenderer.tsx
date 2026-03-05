'use client';

import type { WidgetType } from '@/lib/dashboard/widgets';
import ActiveJobsWidget from './ActiveJobsWidget';
import PendingQuotesWidget from './PendingQuotesWidget';
import RecentMessagesWidget from './RecentMessagesWidget';
import TaskAlertsWidget from './TaskAlertsWidget';
import AdminPendingJobsWidget from './AdminPendingJobsWidget';
import AdminApplicationsWidget from './AdminApplicationsWidget';
import AdminStatsWidget from './AdminStatsWidget';
import AdminApiKeysWidget from './AdminApiKeysWidget';

type Props = {
  widgetType: WidgetType;
  settings?: Record<string, unknown>;
};

export default function WidgetRenderer({ widgetType, settings }: Props) {
  switch (widgetType) {
    case 'active_jobs':
      return <ActiveJobsWidget limit={Number(settings?.limit ?? 6)} />;
    case 'pending_quotes':
      return <PendingQuotesWidget limit={Number(settings?.limit ?? 8)} />;
    case 'recent_messages':
      return <RecentMessagesWidget limit={Number(settings?.limit ?? 6)} />;
    case 'task_alerts':
      return <TaskAlertsWidget />;
    case 'admin_pending_jobs':
      return <AdminPendingJobsWidget />;
    case 'admin_applications':
      return <AdminApplicationsWidget />;
    case 'admin_stats':
      return <AdminStatsWidget />;
    case 'admin_api_keys':
      return <AdminApiKeysWidget />;
    default:
      return null;
  }
}
