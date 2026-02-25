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

type CandidateRow = {
  id: string;
  id_verification_status: string;
  id_verification_document_url: string | null;
  id_verification_reviewed_at: string | null;
};

async function processBatch(rows: CandidateRow[], reason: 'approved_expired' | 'rejected_immediate') {
  let removedFiles = 0;
  let updatedProfiles = 0;
  let deletedDocRows = 0;

  for (const row of rows) {
    const path = row.id_verification_document_url ?? '';
    if (!path) continue;

    const { error: removeError } = await admin.storage.from('pro-documents').remove([path]);
    if (!removeError) removedFiles += 1;

    const { error: profileError } = await admin
      .from('profiles')
      .update({ id_verification_document_url: null })
      .eq('id', row.id);
    if (!profileError) updatedProfiles += 1;

    const { error: deleteDocError } = await admin
      .from('pro_documents')
      .delete()
      .eq('profile_id', row.id)
      .eq('document_type', 'id_verification');
    if (!deleteDocError) deletedDocRows += 1;

    await admin.from('id_verification_retention_logs').insert({
      profile_id: row.id,
      action: reason,
      document_path: path,
      result: removeError || profileError || deleteDocError ? 'partial' : 'success',
      details: {
        storage_error: removeError?.message ?? null,
        profile_error: profileError?.message ?? null,
        document_delete_error: deleteDocError?.message ?? null,
      },
    });
  }

  return { removedFiles, updatedProfiles, deletedDocRows };
}

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

  const now = new Date();
  const approvedThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rejectedRows, error: rejectedError } = await admin
    .from('profiles')
    .select('id,id_verification_status,id_verification_document_url,id_verification_reviewed_at')
    .eq('id_verification_status', 'rejected')
    .not('id_verification_document_url', 'is', null);

  if (rejectedError) {
    return new Response(JSON.stringify({ error: rejectedError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: approvedRows, error: approvedError } = await admin
    .from('profiles')
    .select('id,id_verification_status,id_verification_document_url,id_verification_reviewed_at')
    .eq('id_verification_status', 'approved')
    .not('id_verification_document_url', 'is', null)
    .lt('id_verification_reviewed_at', approvedThreshold);

  if (approvedError) {
    return new Response(JSON.stringify({ error: approvedError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rejectedResult = await processBatch(rejectedRows ?? [], 'rejected_immediate');
  const approvedResult = await processBatch(approvedRows ?? [], 'approved_expired');

  return new Response(
    JSON.stringify({
      ok: true,
      threshold: approvedThreshold,
      rejected: {
        scanned: (rejectedRows ?? []).length,
        ...rejectedResult,
      },
      approved: {
        scanned: (approvedRows ?? []).length,
        ...approvedResult,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
