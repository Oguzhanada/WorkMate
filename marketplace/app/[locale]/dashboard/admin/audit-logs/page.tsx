import { redirect } from 'next/navigation';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import AuditLogsPanel from '@/components/admin/AuditLogsPanel';

export const metadata = { title: 'Audit Logs — WorkMate Admin' };

export default async function AdminAuditLogsPage({
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
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <PageHeader
          title="Audit Logs"
          description="Full trail of admin actions: verifications, GDPR deletions, risk reviews, and more."
          action={
            <Button href={`/${locale}/dashboard/admin`} variant="secondary" size="sm">
              Back to Dashboard
            </Button>
          }
        />
        <AuditLogsPanel />
      </div>
    </Shell>
  );
}
