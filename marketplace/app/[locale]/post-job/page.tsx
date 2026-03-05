import { redirect } from 'next/navigation';
import JobMultiStepForm from '@/components/forms/JobMultiStepForm';
import GuestJobIntentForm from '@/components/forms/GuestJobIntentForm';
import { canPostJobWithIdentity, getUserRoles } from '@/lib/auth/rbac';
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
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canCreate = false;
  if (user) {
    const [{ data: profile }, roles] = await Promise.all([
      supabase.from('profiles').select('id_verification_status').eq('id', user.id).maybeSingle(),
      getUserRoles(supabase, user.id),
    ]);
    canCreate = canPostJobWithIdentity(roles, profile?.id_verification_status);
    if (!canCreate) {
      redirect(`/${locale}/profile?message=identity_required`);
    }
  }

  return (
    <Shell
      header={
        <Card className="rounded-3xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1>Create Job Request</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
        ) : (
          <GuestJobIntentForm />
        )}
      </section>
    </Shell>
  );
}

