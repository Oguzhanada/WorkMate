'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ProOnboardingForm from '@/components/forms/ProOnboardingForm';

export default function ProDashboard({ profileId }: { profileId: string }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', profileId).single().then(({ data }) => setProfile(data));
    supabase.from('jobs').select('*').eq('status', 'open').order('created_at', { ascending: false }).then(({ data }) => setJobs(data || []));
  }, [profileId]);

  const submitQuote = async (jobId: string) => {
    await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        pro_id: profileId,
        quote_amount_cents: 35000,
        availability_slots: [{ start: '2026-02-21T09:00:00Z', end: '2026-02-21T12:00:00Z' }],
      }),
    });
    alert('Teklif gönderildi');
  };

  if (!profile?.is_verified) {
    return <ProOnboardingForm profileId={profileId} />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pro Dashboard</h1>
      {jobs.map((job) => (
        <div key={job.id} className="rounded border p-4">
          <p className="font-semibold">{job.title}</p>
          <p className="text-sm text-gray-600">{job.category} • {job.eircode}</p>
          <button onClick={() => submitQuote(job.id)} className="mt-2 rounded bg-emerald-700 px-3 py-2 text-white">Teklif Ver</button>
        </div>
      ))}
    </div>
  );
}
