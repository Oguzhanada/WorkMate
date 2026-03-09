import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { logAdminAudit } from '@/lib/admin/audit';
import { sendNotification } from '@/lib/notifications/send';
import { batchVerificationSchema } from '@/lib/validation/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mask an email so PII is not exposed in queue responses. */
function maskEmail(email: string | null | undefined): string {
  if (!email) return '—';
  const atIdx = email.indexOf('@');
  if (atIdx < 2) return '***@***';
  return email.slice(0, 2) + '***' + email.slice(atIdx);
}

// ─── GET — verification queue with stats ──────────────────────────────────────

export async function GET(_request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { supabase } = auth;

  // Fetch profiles pending either main or ID verification, oldest first
  const { data: pendingProfiles, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id,full_name,email,verification_status,id_verification_status,created_at,risk_score'
    )
    .or('verification_status.eq.pending,id_verification_status.eq.pending')
    .order('created_at', { ascending: true });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const profiles = pendingProfiles ?? [];
  const profileIds = profiles.map((p) => p.id);

  // Document counts per profile
  let docCountByProfile: Record<string, number> = {};
  if (profileIds.length > 0) {
    const { data: docs } = await supabase
      .from('pro_documents')
      .select('profile_id')
      .in('profile_id', profileIds);

    docCountByProfile = (docs ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.profile_id] = (acc[row.profile_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  // Queue stats
  const pendingCount = profiles.filter((p) => p.verification_status === 'pending').length;
  const idPendingCount = profiles.filter((p) => p.id_verification_status === 'pending').length;

  // Avg wait time in days (from created_at to now)
  const avgWaitDays =
    profiles.length > 0
      ? Math.round(
          profiles.reduce((sum, p) => {
            const msPerDay = 1000 * 60 * 60 * 24;
            return sum + (Date.now() - new Date(p.created_at).getTime()) / msPerDay;
          }, 0) / profiles.length
        )
      : 0;

  const queue = profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name ?? null,
    email_masked: maskEmail(p.email),
    verification_status: p.verification_status,
    id_verification_status: p.id_verification_status,
    created_at: p.created_at,
    risk_score: p.risk_score ?? null,
    document_count: docCountByProfile[p.id] ?? 0,
  }));

  return NextResponse.json({
    queue,
    stats: {
      pending: pendingCount,
      id_pending: idPendingCount,
      avg_wait_days: avgWaitDays,
      total: profiles.length,
    },
  });
}

// ─── PATCH — batch approve / reject ──────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const serviceSupabase = getSupabaseServiceClient();

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = batchVerificationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { profile_ids, action, reason } = parsed.data;
  const now = new Date().toISOString();

  // Build the profile update payload
  const profilePatch =
    action === 'approve'
      ? {
          verification_status: 'verified',
          is_verified: true,
          id_verification_status: 'approved',
          id_verification_reviewed_by: user?.id ?? null,
          id_verification_reviewed_at: now,
          id_verification_rejected_reason: null,
        }
      : {
          verification_status: 'rejected',
          is_verified: false,
          id_verification_status: 'rejected',
          id_verification_reviewed_by: user?.id ?? null,
          id_verification_reviewed_at: now,
          id_verification_rejected_reason: reason ?? 'Identity verification was rejected.',
        };

  const { error: updateError } = await serviceSupabase
    .from('profiles')
    .update(profilePatch)
    .in('id', profile_ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // For approvals: upsert verified_pro role in user_roles
  if (action === 'approve') {
    const roleRows = profile_ids.map((uid) => ({
      user_id: uid,
      role: 'verified_pro',
      updated_at: now,
    }));
    await serviceSupabase
      .from('user_roles')
      .upsert(roleRows, { onConflict: 'user_id,role' });
  }

  // Fire notifications (fire-and-forget — never fail the response on this)
  await Promise.allSettled(
    profile_ids.map((uid) =>
      action === 'approve'
        ? sendNotification({
            userId: uid,
            type: 'system',
            title: 'Application Approved — Welcome to WorkMate!',
            body: 'Your provider application has been approved. You can now receive job offers.',
          })
        : sendNotification({
            userId: uid,
            type: 'system',
            title: 'Application Update',
            body: reason ?? 'Your application was not approved at this time.',
          })
    )
  );

  // Audit log — one entry per batch action
  await logAdminAudit({
    adminUserId: user?.id ?? null,
    adminEmail: user?.email ?? null,
    action: action === 'approve' ? 'batch_verification_approved' : 'batch_verification_rejected',
    targetType: 'provider_application',
    details: {
      profile_ids,
      reason: reason ?? null,
      count: profile_ids.length,
      reviewed_at: now,
    },
  });

  return NextResponse.json({ success: true, processed: profile_ids.length });
}
