'use client';

import TaskAlertsPanel from '@/components/dashboard/TaskAlertsPanel';

export default function TaskAlertsWidget() {
  return (
    <div>
      <p className="text-sm font-bold" style={{ color: 'var(--wm-navy)' }}>Task Alerts</p>
      <p className="mt-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
        Configure matching preferences for new job notifications.
      </p>
      <TaskAlertsPanel hideHeader />
    </div>
  );
}
