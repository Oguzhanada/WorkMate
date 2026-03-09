'use client';

import TaskAlertsPanel from '@/components/dashboard/TaskAlertsPanel';

export default function TaskAlertsWidget() {
  return (
    <div>
      <p className="text-sm font-bold" style={{ color: '#0f172a' }}>Task Alerts</p>
      <p className="mt-1 text-xs" style={{ color: '#64748b' }}>
        Configure matching preferences for new job notifications.
      </p>
      <TaskAlertsPanel hideHeader />
    </div>
  );
}
