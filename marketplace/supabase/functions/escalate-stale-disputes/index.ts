import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const CRON_SECRET = Deno.env.get('CRON_SECRET');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
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

  const nowIso = new Date().toISOString();

  const { data: staleDisputes, error } = await admin
    .from('disputes')
    .select('id,job_id,created_by,status,resolution_deadline,stale_notified_at')
    .in('status', ['open', 'under_review'])
    .lt('resolution_deadline', nowIso)
    .is('stale_notified_at', null)
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if ((staleDisputes ?? []).length === 0) {
    return new Response(JSON.stringify({ ok: true, stale_count: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: admins } = await admin.from('user_roles').select('user_id').eq('role', 'admin');
  const adminUserIds = (admins ?? []).map((row) => row.user_id);

  for (const dispute of staleDisputes ?? []) {
    await admin
      .from('disputes')
      .update({
        stale_notified_at: nowIso,
        status: 'under_review',
        updated_at: nowIso,
      })
      .eq('id', dispute.id);

    await admin.from('dispute_logs').insert({
      dispute_id: dispute.id,
      actor_id: dispute.created_by,
      actor_role: 'system',
      action: 'stale_escalated',
      details: {
        resolution_deadline: dispute.resolution_deadline,
      },
      old_status: dispute.status,
      new_status: 'under_review',
    });

    if (adminUserIds.length > 0) {
      await admin.from('notifications').insert(
        adminUserIds.map((userId) => ({
          user_id: userId,
          type: 'dispute_escalated',
          payload: {
            dispute_id: dispute.id,
            job_id: dispute.job_id,
            reason: 'Resolution deadline exceeded (7+ days).',
          },
        }))
      );
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      stale_count: staleDisputes?.length ?? 0,
      notified_admins: adminUserIds.length,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});