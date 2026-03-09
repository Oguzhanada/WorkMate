import JobMultiStepForm from '@/components/forms/JobMultiStepForm';
import GuestJobIntentForm from '@/components/forms/GuestJobIntentForm';
import { canPostJobWithIdentity, getUserRoles } from '@/lib/auth/rbac';
import type { AppRole } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Shell from '@/components/ui/Shell';
import StatCard from '@/components/ui/StatCard';
import { FileText, MapPin, Send } from 'lucide-react';

export default async function LocalizedPostJobPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let user: { id: string } | null = null;
  let canCreate = false;
  let blockedByRole = false;

  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    user = authUser ? { id: authUser.id } : null;

    if (user) {
      const [{ data: profile }, roles] = await Promise.all([
        supabase.from('profiles').select('id_verification_status').eq('id', user.id).maybeSingle(),
        getUserRoles(supabase, user.id),
      ]);
      const effectiveRoles: AppRole[] = roles.length ? roles : ['customer'];
      canCreate = canPostJobWithIdentity(effectiveRoles, profile?.id_verification_status);
      blockedByRole = !canCreate;
    }
  } catch {
    // Never break page rendering for visitors when server auth/profile checks fail.
    user = null;
    canCreate = false;
    blockedByRole = false;
  }

  return (
    <Shell
      header={
        <Card
          className="rounded-[1.6rem]"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.9) 100%)',
            boxShadow: 'var(--wm-shadow-lg)',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold" style={{ color: '#0f172a', letterSpacing: '-0.03em' }}>Create Job Request</h1>
              <p className="text-sm" style={{ color: '#475569' }}>
                Share clear details to receive faster and more accurate quotes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button href={`/${locale}/providers`} variant="secondary">
                Browse providers
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard label="Step 1" value="Describe" icon={<FileText className="h-4 w-4" />} />
            <StatCard label="Step 2" value="Locate" icon={<MapPin className="h-4 w-4" />} />
            <StatCard label="Step 3" value="Submit" icon={<Send className="h-4 w-4" />} />
          </div>
        </Card>
      }
    >
      <section className="mt-6">
        {user && canCreate ? (
          <JobMultiStepForm customerId={user.id} />
        ) : user && blockedByRole ? (
          <Card className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Your account cannot post jobs yet</h2>
            <p className="mt-2 text-sm" style={{ color: '#334155' }}>
              Complete your profile and required verification details to unlock job posting.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button href={`/${locale}/profile`} variant="primary">
                Go to profile
              </Button>
              <Button href={`/${locale}/providers`} variant="secondary">
                Browse providers
              </Button>
            </div>
          </Card>
        ) : (
          <GuestJobIntentForm />
        )}
      </section>
    </Shell>
  );
}

