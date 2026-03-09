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
import CustomerStatsWidget from './CustomerStatsWidget';
import ProviderEarningsWidget from './ProviderEarningsWidget';
import AdminFeatureFlagsWidget from './AdminFeatureFlagsWidget';
import ProviderSubscriptionWidget from './ProviderSubscriptionWidget';
import GardaVettingRequestWidget from '../GardaVettingRequestWidget';
import ProfileCompletenessWidget from '../ProfileCompletenessWidget';
import AvailabilityWidget from './AvailabilityWidget';
import PortfolioManagerWidget from '../PortfolioManagerWidget';

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
    case 'customer_stats':
      return <CustomerStatsWidget />;
    case 'provider_earnings':
      return <ProviderEarningsWidget />;
    case 'admin_pending_jobs':
      return <AdminPendingJobsWidget />;
    case 'admin_applications':
      return <AdminApplicationsWidget />;
    case 'admin_stats':
      return <AdminStatsWidget />;
    case 'admin_api_keys':
      return <AdminApiKeysWidget />;
    case 'admin_feature_flags':
      return <AdminFeatureFlagsWidget />;
    case 'provider_subscription':
      return <ProviderSubscriptionWidget />;
    case 'garda_vetting':
      return <GardaVettingRequestWidget />;
    case 'profile_completeness':
      return <ProfileCompletenessWidget />;
    case 'availability':
      return <AvailabilityWidget />;
    case 'portfolio':
      return <PortfolioManagerWidget />;
    default:
      return null;
  }
}
