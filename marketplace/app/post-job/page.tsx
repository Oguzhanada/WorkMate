import { redirect } from 'next/navigation';
import JobMultiStepForm from '@/components/forms/JobMultiStepForm';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function PostJobPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/en/giris');
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">İş Talebi Oluştur</h1>
      <JobMultiStepForm customerId={user.id} />
    </main>
  );
}
