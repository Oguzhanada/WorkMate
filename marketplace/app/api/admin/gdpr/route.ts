import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { logAdminAudit } from '@/lib/admin/audit';
import { processGdprDeletionSchema } from '@/lib/validation/api';

const HOLD_DAYS = 30;

// GET /api/admin/gdpr
// Returns all profiles with a pending deletion request, ordered by request date.
// Each record includes days_since_request and is_eligible (>= 30 days).
export async function GET(request: NextRequest) {
  void request; // no query params used
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const svc = getSupabaseServiceClient();

  const { data, error } = await svc
    .from('profiles')
    .select('id, full_name, email, deletion_requested_at')
    .not('deletion_requested_at', 'is', null)
    .order('deletion_requested_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const records = (data ?? []).map((row) => {
    const requestedAt = new Date(row.deletion_requested_at as string).getTime();
    const daysSince = Math.floor((now - requestedAt) / (1000 * 60 * 60 * 24));
    return {
      id: row.id,
      full_name: row.full_name ?? null,
      email: row.email ?? null,
      deletion_requested_at: row.deletion_requested_at,
      days_since_request: daysSince,
      is_eligible: daysSince >= HOLD_DAYS,
    };
  });

  return NextResponse.json({ requests: records });
}

// DELETE /api/admin/gdpr
// Processes a hard deletion for a profile that has passed the 30-day hold.
// Body: { profile_id: string (UUID) }
//
// Deletion order (FK-safe):
//   1. reviews (reviewer_id or provider_id)
//   2. appointments (customer_id or provider_id)
//   3. jobs (customer_id) — offers cascade from jobs
//   4. favourite_providers (customer_id or provider_id)
//   5. user_roles
//   6. profiles
//   7. auth.users (via admin SDK)
//
// Financial records (job_contracts, provider_subscriptions, stripe data) are
// intentionally NOT deleted — retained for 7-year statutory obligation.
export async function DELETE(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = processGdprDeletionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { profile_id } = parsed.data;
  const svc = getSupabaseServiceClient();

  // ── 1. Verify the deletion request exists and hold period has elapsed ────────
  const { data: profile, error: fetchError } = await svc
    .from('profiles')
    .select('id, full_name, deletion_requested_at')
    .eq('id', profile_id)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (!profile.deletion_requested_at) {
    return NextResponse.json(
      { error: 'No deletion request on file for this profile' },
      { status: 409 }
    );
  }

  const requestedAt = new Date(profile.deletion_requested_at as string).getTime();
  const daysSince = Math.floor((Date.now() - requestedAt) / (1000 * 60 * 60 * 24));
  if (daysSince < HOLD_DAYS) {
    return NextResponse.json(
      {
        error: `Deletion hold period not elapsed. ${HOLD_DAYS - daysSince} day(s) remaining.`,
        days_remaining: HOLD_DAYS - daysSince,
      },
      { status: 409 }
    );
  }

  // ── 2. Hard delete in FK-safe order ─────────────────────────────────────────

  // 2a. Reviews (as reviewer or provider)
  const { error: reviewsErr } = await svc
    .from('reviews')
    .delete()
    .or(`reviewer_id.eq.${profile_id},provider_id.eq.${profile_id}`);
  if (reviewsErr) {
    console.error('[GDPR] reviews delete failed', profile_id, reviewsErr.message);
    return NextResponse.json({ error: 'Failed during review deletion' }, { status: 500 });
  }

  // 2b. Appointments (as customer or provider)
  const { error: apptErr } = await svc
    .from('appointments')
    .delete()
    .or(`customer_id.eq.${profile_id},provider_id.eq.${profile_id}`);
  if (apptErr) {
    console.error('[GDPR] appointments delete failed', profile_id, apptErr.message);
    return NextResponse.json({ error: 'Failed during appointment deletion' }, { status: 500 });
  }

  // 2c. Jobs posted by the customer (offers/quotes cascade from jobs via FK)
  const { error: jobsErr } = await svc
    .from('jobs')
    .delete()
    .eq('customer_id', profile_id);
  if (jobsErr) {
    console.error('[GDPR] jobs delete failed', profile_id, jobsErr.message);
    return NextResponse.json({ error: 'Failed during job deletion' }, { status: 500 });
  }

  // 2d. Favourite providers (as customer or saved provider)
  const { error: favErr } = await svc
    .from('favourite_providers')
    .delete()
    .or(`customer_id.eq.${profile_id},provider_id.eq.${profile_id}`);
  if (favErr) {
    console.error('[GDPR] favourite_providers delete failed', profile_id, favErr.message);
    return NextResponse.json({ error: 'Failed during favourites deletion' }, { status: 500 });
  }

  // 2e. User roles
  const { error: rolesErr } = await svc
    .from('user_roles')
    .delete()
    .eq('user_id', profile_id);
  if (rolesErr) {
    console.error('[GDPR] user_roles delete failed', profile_id, rolesErr.message);
    return NextResponse.json({ error: 'Failed during roles deletion' }, { status: 500 });
  }

  // 2f. Profile row
  const { error: profileErr } = await svc
    .from('profiles')
    .delete()
    .eq('id', profile_id);
  if (profileErr) {
    console.error('[GDPR] profiles delete failed', profile_id, profileErr.message);
    return NextResponse.json({ error: 'Failed during profile deletion' }, { status: 500 });
  }

  // 2g. Auth user — must be last (FK constraint from profiles.id → auth.users.id)
  const { error: authErr } = await svc.auth.admin.deleteUser(profile_id);
  if (authErr) {
    // Profile row is already gone; log but don't fail — auth cleanup is best-effort
    // at this point since the public data has been removed.
    console.error('[GDPR] auth.users delete failed', profile_id, authErr.message);
  }

  // ── 3. Audit log ─────────────────────────────────────────────────────────────
  await logAdminAudit({
    adminUserId:   auth.user?.id    ?? null,
    adminEmail:    auth.user?.email ?? null,
    action:        'gdpr_deletion_processed',
    targetType:    'profile',
    targetProfileId: profile_id,
    targetLabel:   profile.full_name ?? null,
    details: {
      profile_id,
      processed_by: auth.user?.id ?? null,
      processed_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({ deleted: true, profile_id });
}
