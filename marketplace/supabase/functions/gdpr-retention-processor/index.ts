import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * GDPR Retention Processor — Supabase Edge Function
 *
 * Runs on a cron schedule (daily). Finds profiles with deletion_requested_at
 * older than 30 days and performs a FK-safe hard delete.
 *
 * Financial records (job_contracts, provider_subscriptions) are retained
 * for 7-year statutory obligation — NOT deleted.
 *
 * Schedule via pg_cron:
 *   SELECT cron.schedule('gdpr-daily', '0 3 * * *',
 *     $$SELECT extensions.http((
 *       'POST', '<FUNCTION_URL>', '{}',
 *       'application/json', ARRAY[extensions.http_header('Authorization','Bearer <CRON_SECRET>')]
 *     )::extensions.http_request)$$
 *   );
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const CRON_SECRET = Deno.env.get('CRON_SECRET');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const HOLD_DAYS = 30;

type DeletionCandidate = {
  id: string;
  full_name: string | null;
  email: string | null;
  deletion_requested_at: string;
};

async function sendDeletionConfirmationEmail(to: string, name: string | null): Promise<void> {
  if (!RESEND_API_KEY) return;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WorkMate <notifications@workmate.ie>',
        to,
        subject: 'Your WorkMate account has been permanently deleted',
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:#1a56db;padding:20px 32px;">
            <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">WorkMate</span>
          </td>
        </tr>
        <tr><td style="padding:32px;color:#1e293b;">
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Account deleted</h2>
          <p style="margin:0 0 20px;color:#64748b;">Hi${name ? ` ${name}` : ''}, your WorkMate account and personal data have been permanently deleted as requested.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;">
            <tr><td style="padding:4px 0;">
              <span style="color:#64748b;font-size:13px;">What was deleted</span><br />
              <strong>Your profile, reviews, jobs, appointments, and saved preferences.</strong>
            </td></tr>
            <tr><td style="padding:12px 0 4px;">
              <span style="color:#64748b;font-size:13px;">What was retained</span><br />
              <strong>Financial transaction records (7-year statutory requirement).</strong>
            </td></tr>
          </table>

          <p style="margin-top:8px;font-size:13px;color:#64748b;">This action is irreversible. If you wish to use WorkMate in the future, you will need to create a new account. Thank you for being part of our community.</p>
        </td></tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
            WorkMate Ireland Ltd &bull; This is the final email you will receive from us.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    });
  } catch {
    // Best-effort — never fail the deletion because of an email error
    console.error('[GDPR] Failed to send deletion confirmation email to', to);
  }
}

async function deleteProfile(profile: DeletionCandidate): Promise<{ ok: boolean; error?: string }> {
  const pid = profile.id;

  // FK-safe deletion order (matches admin GDPR route)
  const steps: Array<{ label: string; fn: () => Promise<{ error: { message: string } | null }> }> = [
    {
      label: 'notifications',
      fn: () => admin.from('notifications').delete().eq('user_id', pid),
    },
    {
      label: 'saved_searches',
      fn: () => admin.from('saved_searches').delete().eq('user_id', pid),
    },
    {
      label: 'reviews',
      fn: () => admin.from('reviews').delete().or(`reviewer_id.eq.${pid},provider_id.eq.${pid}`),
    },
    {
      label: 'appointments',
      fn: () => admin.from('appointments').delete().or(`customer_id.eq.${pid},provider_id.eq.${pid}`),
    },
    {
      label: 'jobs',
      fn: () => admin.from('jobs').delete().eq('customer_id', pid),
    },
    {
      label: 'favourite_providers',
      fn: () => admin.from('favourite_providers').delete().or(`customer_id.eq.${pid},provider_id.eq.${pid}`),
    },
    {
      label: 'user_roles',
      fn: () => admin.from('user_roles').delete().eq('user_id', pid),
    },
    {
      label: 'profiles',
      fn: () => admin.from('profiles').delete().eq('id', pid),
    },
  ];

  for (const step of steps) {
    const { error } = await step.fn();
    if (error) {
      console.error(`[GDPR] ${step.label} delete failed for ${pid}:`, error.message);
      return { ok: false, error: `${step.label}: ${error.message}` };
    }
  }

  // Auth user — must be last
  const { error: authErr } = await admin.auth.admin.deleteUser(pid);
  if (authErr) {
    console.error(`[GDPR] auth.users delete failed for ${pid}:`, authErr.message);
    // Profile already gone; continue — auth cleanup is best-effort
  }

  // Audit log
  await admin.from('admin_audit_logs').insert({
    admin_user_id: null,
    admin_email: 'system:gdpr-cron',
    action: 'gdpr_deletion_processed',
    target_type: 'profile',
    target_profile_id: pid,
    target_label: profile.full_name ?? null,
    details: {
      profile_id: pid,
      processed_by: 'gdpr-retention-processor',
      processed_at: new Date().toISOString(),
    },
  });

  // Send confirmation email
  if (profile.email) {
    await sendDeletionConfirmationEmail(profile.email, profile.full_name);
  }

  return { ok: true };
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Auth check
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Find eligible profiles (deletion requested >= 30 days ago)
  const threshold = new Date(Date.now() - HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error: queryError } = await admin
    .from('profiles')
    .select('id, full_name, email, deletion_requested_at')
    .not('deletion_requested_at', 'is', null)
    .lt('deletion_requested_at', threshold);

  if (queryError) {
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const candidate of candidates ?? []) {
    const result = await deleteProfile(candidate);
    results.push({ id: candidate.id, ...result });
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return new Response(
    JSON.stringify({
      ok: true,
      threshold,
      scanned: (candidates ?? []).length,
      succeeded,
      failed,
      results,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
