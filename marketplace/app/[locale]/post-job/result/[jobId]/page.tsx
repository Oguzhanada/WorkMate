import { notFound, redirect } from 'next/navigation';

import JobSubmissionResult from '@/components/forms/JobSubmissionResult';
import { getSupabaseServerClient } from '@/lib/supabase/server';

type Job = {
  id: string;
  title: string;
  description: string;
  eircode: string;
  county: string | null;
  locality: string | null;
  budget_range: string;
  status: string;
  review_status: string;
  created_at: string;
  photo_urls: string[] | null;
};

export default async function JobResultPage({
  params,
}: {
  params: Promise<{ locale: string; jobId: string }>;
}) {
  const { locale, jobId } = await params;
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('id,title,description,eircode,county,locality,budget_range,status,review_status,created_at,photo_urls')
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return <JobSubmissionResult initialJob={data as Job} customerId={user.id} />;
}
