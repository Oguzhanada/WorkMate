import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import Button from '@/components/ui/Button';
import DashboardShell from '@/components/dashboard/DashboardShell';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'WorkMate admin dashboard overview.',
};

// Admin quick-links — surfaces key admin tools that live outside the widget grid.
const ADMIN_QUICK_LINKS = [
  {
    label: 'Platform Stats',
    description: "Bird's-eye view of users, jobs, revenue, and growth trends.",
    path: '/dashboard/admin/stats',
  },
  {
    label: 'Risk Assessment',
    description: 'Bulk review providers flagged by risk score.',
    path: '/dashboard/admin/risk',
  },
  {
    label: 'Provider Applications',
    description: 'Review pending verification applications.',
    path: '/dashboard/admin/applications',
  },
  {
    label: 'Funnel Analytics',
    description: 'Step-by-step conversion rates across all funnels.',
    path: '/dashboard/admin/analytics',
  },
  {
    label: 'GDPR Requests',
    description: 'Process pending account deletion requests after the 30-day hold.',
    path: '/dashboard/admin/gdpr',
  },
  {
    label: 'Verification Queue',
    description: 'Batch-process pending provider verification applications.',
    path: '/dashboard/admin/verification',
  },
  {
    label: 'Audit Logs',
    description: 'Full trail of admin actions: verifications, GDPR deletions, risk reviews.',
    path: '/dashboard/admin/audit-logs',
  },
  {
    label: 'Service Status',
    description: 'Real-time health of Supabase, Stripe, Resend, Anthropic, and Sentry.',
    path: '/dashboard/admin/status',
  },
] as const;

export default async function LocalizedAdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    redirect(`/${locale}/profile`);
  }

  return (
    <Shell>
      {/* Quick links to admin sub-pages */}
      <div
        className="mb-6 rounded-2xl border p-5"
        style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)', boxShadow: 'var(--wm-shadow-sm)' }}
      >
        <p
          className="mb-3 text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-display)' }}
        >
          Admin Tools
        </p>
        <div className="flex flex-wrap gap-3">
          {ADMIN_QUICK_LINKS.map((link) => (
            <Button
              key={link.path}
              href={`/${locale}${link.path}`}
              variant="secondary"
              size="sm"
            >
              {link.label}
            </Button>
          ))}
        </div>
      </div>

      <DashboardShell
        mode="admin"
        title="Admin Dashboard"
        description="Configure review, analytics, and operations widgets for your workflow."
      />
    </Shell>
  );
}
