import { redirect } from 'next/navigation';
import ProDashboard from '@/components/dashboard/ProDashboard';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function ProDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/en/giris');
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <ProDashboard profileId={user.id} />
    </main>
  );
}
