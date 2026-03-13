import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout';
import AdminToastWrapper from '@/components/admin/AdminToastWrapper';

/**
 * Admin section layout — persistent sidebar + auth guard.
 *
 * The sidebar stays mounted across all admin routes; only the content area
 * (`{children}`) is replaced on navigation, giving SPA-like feel without
 * client-side routing complexity.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
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
    redirect(`/${locale}/dashboard`);
  }

  // Fetch badge counts for sidebar (non-fatal — defaults to 0 on error)
  let pendingVerification = 0;
  let pendingDocs = 0;
  try {
    const [{ count: pv }, { count: pd }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'pending'),
      supabase
        .from('pro_documents')
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'pending'),
    ]);
    pendingVerification = pv ?? 0;
    pendingDocs = pd ?? 0;
  } catch { /* non-fatal */ }

  return (
    <AdminToastWrapper>
      <AdminSidebarLayout
        locale={locale}
        pendingVerification={pendingVerification}
        pendingDocs={pendingDocs}
        adminEmail={user.email ?? undefined}
      >
        {children}
      </AdminSidebarLayout>
    </AdminToastWrapper>
  );
}
