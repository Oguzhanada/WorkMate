import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const CRON_SECRET = Deno.env.get('CRON_SECRET');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in function environment.');
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Keep messages for one year after job completion.
  const thresholdIso = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data: oldCompletedJobs, error: jobError } = await admin
    .from('jobs')
    .select('id')
    .eq('status', 'completed')
    .lt('complete_marked_at', thresholdIso);

  if (jobError) {
    return new Response(JSON.stringify({ error: jobError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const jobIds = (oldCompletedJobs ?? []).map((job) => job.id);
  if (jobIds.length === 0) {
    return new Response(
      JSON.stringify({
        ok: true,
        deleted_messages: 0,
        scanned_completed_jobs: 0,
        threshold: thresholdIso,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { data: messagesToDelete, error: countError } = await admin
    .from('job_messages')
    .select('id')
    .in('job_id', jobIds);

  if (countError) {
    return new Response(JSON.stringify({ error: countError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error: deleteError } = await admin.from('job_messages').delete().in('job_id', jobIds);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      deleted_messages: (messagesToDelete ?? []).length,
      scanned_completed_jobs: jobIds.length,
      threshold: thresholdIso,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
