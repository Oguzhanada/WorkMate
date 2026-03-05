import type { AppRole } from '@/lib/auth/rbac';

export type DashboardMode = 'customer' | 'provider' | 'admin';

export type WidgetType =
  | 'active_jobs'
  | 'pending_quotes'
  | 'recent_messages'
  | 'task_alerts'
  | 'customer_stats'
  | 'admin_pending_jobs'
  | 'admin_applications'
  | 'admin_stats'
  | 'admin_api_keys';

export type WidgetPosition = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type WidgetConfig = {
  widget_type: WidgetType;
  position: WidgetPosition;
  settings: Record<string, unknown>;
};

const ALLOWED_WIDGETS: Record<DashboardMode, WidgetType[]> = {
  customer: ['customer_stats', 'active_jobs', 'pending_quotes', 'recent_messages'],
  provider: ['active_jobs', 'pending_quotes', 'recent_messages', 'task_alerts'],
  admin: ['admin_pending_jobs', 'admin_applications', 'admin_stats', 'admin_api_keys', 'recent_messages'],
};

const DEFAULT_WIDGETS: Record<DashboardMode, WidgetConfig[]> = {
  customer: [
    { widget_type: 'customer_stats', position: { x: 0, y: 0, w: 12, h: 2 }, settings: {} },
    { widget_type: 'active_jobs', position: { x: 0, y: 1, w: 6, h: 2 }, settings: {} },
    { widget_type: 'pending_quotes', position: { x: 6, y: 1, w: 6, h: 2 }, settings: {} },
    { widget_type: 'recent_messages', position: { x: 0, y: 2, w: 12, h: 2 }, settings: { limit: 6 } },
  ],
  provider: [
    { widget_type: 'active_jobs', position: { x: 0, y: 0, w: 6, h: 2 }, settings: {} },
    { widget_type: 'pending_quotes', position: { x: 6, y: 0, w: 6, h: 2 }, settings: {} },
    { widget_type: 'task_alerts', position: { x: 0, y: 1, w: 12, h: 3 }, settings: {} },
    { widget_type: 'recent_messages', position: { x: 0, y: 2, w: 12, h: 2 }, settings: { limit: 6 } },
  ],
  admin: [
    { widget_type: 'admin_stats', position: { x: 0, y: 0, w: 6, h: 2 }, settings: {} },
    { widget_type: 'admin_pending_jobs', position: { x: 6, y: 0, w: 6, h: 2 }, settings: {} },
    { widget_type: 'admin_applications', position: { x: 0, y: 1, w: 6, h: 2 }, settings: {} },
    { widget_type: 'admin_api_keys', position: { x: 6, y: 1, w: 6, h: 2 }, settings: {} },
    { widget_type: 'recent_messages', position: { x: 0, y: 2, w: 12, h: 2 }, settings: { limit: 6 } },
  ],
};

export function normalizeDashboardMode(mode: string | null | undefined): DashboardMode {
  if (mode === 'admin') return 'admin';
  if (mode === 'provider') return 'provider';
  return 'customer';
}

export function isModeAllowedForRoles(mode: DashboardMode, roles: AppRole[]) {
  if (mode === 'admin') return roles.includes('admin');
  if (mode === 'provider') return roles.includes('verified_pro') || roles.includes('admin');
  return roles.includes('customer') || roles.includes('admin');
}

export function getAllowedWidgetTypes(mode: DashboardMode) {
  return ALLOWED_WIDGETS[mode];
}

export function isWidgetAllowedForMode(mode: DashboardMode, widgetType: string): widgetType is WidgetType {
  return ALLOWED_WIDGETS[mode].includes(widgetType as WidgetType);
}

export function getDefaultWidgets(mode: DashboardMode): WidgetConfig[] {
  return DEFAULT_WIDGETS[mode].map((item) => ({
    widget_type: item.widget_type,
    position: { ...item.position },
    settings: { ...item.settings },
  }));
}

export function getWidgetLabel(widgetType: WidgetType) {
  switch (widgetType) {
    case 'active_jobs':
      return 'Active Jobs';
    case 'pending_quotes':
      return 'Pending Quotes';
    case 'recent_messages':
      return 'Recent Messages';
    case 'task_alerts':
      return 'Task Alerts';
    case 'customer_stats':
      return 'My Stats';
    case 'admin_pending_jobs':
      return 'Pending Job Reviews';
    case 'admin_applications':
      return 'Provider Applications';
    case 'admin_stats':
      return 'Admin Stats';
    case 'admin_api_keys':
      return 'API Keys';
    default:
      return widgetType;
  }
}
