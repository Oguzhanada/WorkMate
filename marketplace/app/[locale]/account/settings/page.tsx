import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import PageHeader from '@/components/ui/PageHeader';
import GdprPanel from '@/components/account/GdprPanel';
import NotificationPrefsPanel from '@/components/account/NotificationPrefsPanel';

export const metadata: Metadata = {
  title: 'Account Settings — WorkMate',
  description: 'Manage your notification preferences, privacy settings, and account data.',
};

export default async function AccountSettingsPage({
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

  return (
    <main className="py-10">
      <div style={{ width: 'min(720px, calc(100% - 32px))', margin: '0 auto' }}>
        <div className="mb-8">
          <PageHeader
            title="Account Settings"
            description="Manage notifications, privacy, and account data."
          />
        </div>

        {/* ── Notifications ──────────────────────────────────────────────── */}
        <section className="mb-8" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2
            className="px-1 text-sm font-semibold uppercase tracking-widest"
            style={{ color: 'var(--wm-muted)' }}
          >
            Notifications
          </h2>
          <NotificationPrefsPanel />
        </section>

        {/* ── Privacy & GDPR ────────────────────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2
            className="px-1 text-sm font-semibold uppercase tracking-widest"
            style={{ color: 'var(--wm-muted)' }}
          >
            Privacy &amp; Data
          </h2>
          <GdprPanel />
        </section>
      </div>
    </main>
  );
}
