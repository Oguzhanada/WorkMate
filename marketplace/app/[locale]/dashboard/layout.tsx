import { ReactNode } from 'react';

/**
 * Dashboard nested layout.
 *
 * Provides a common structural wrapper for all dashboard pages
 * (admin, pro, customer, disputes, appointments, etc.).
 *
 * Individual pages handle their own auth/RBAC checks — this layout
 * only supplies shared structure so the error boundary and loading
 * states render in a consistent container.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {children}
    </div>
  );
}
