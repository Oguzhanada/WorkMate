import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Admin section layout guard.
 *
 * Runs server-side on every admin route (stats, verification, risk, gdpr,
 * analytics, applications, audit-logs, status). Redirects unauthenticated
 * users to login and non-admins to /dashboard.
 *
 * Defence-in-depth — individual sub-pages may still check roles for their
 * own API calls, but this layout prevents loading admin UI entirely.
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

  return <>{children}</>;
}
