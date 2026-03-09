import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { sendTransactionalEmail } from '@/lib/email/send';
import { sendNotification } from '@/lib/notifications/send';

const patchGardaVettingSchema = z.object({
  garda_vetting_status: z.enum(['not_required', 'pending', 'approved', 'rejected', 'expired']),
  garda_vetting_reference: z.string().trim().max(100).optional().nullable(),
  garda_vetting_expires_at: z.string().date().optional().nullable(),
});

// PATCH /api/admin/garda-vetting/[profileId] — update vetting status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = patchGardaVettingSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const service = getSupabaseServiceClient();

  // Verify profile exists
  const { data: profile } = await service
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { data: updated, error: updateError } = await service
    .from('profiles')
    .update({
      garda_vetting_status: parsed.data.garda_vetting_status,
      garda_vetting_reference: parsed.data.garda_vetting_reference ?? null,
      garda_vetting_expires_at: parsed.data.garda_vetting_expires_at ?? null,
    })
    .eq('id', profileId)
    .select('id,garda_vetting_status,garda_vetting_reference,garda_vetting_expires_at')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // In-app notification for approved/rejected — fire-and-forget
  if (parsed.data.garda_vetting_status === 'approved') {
    sendNotification({
      userId: profileId,
      type: 'vetting_update',
      title: 'Garda Vetting Approved',
    });
  } else if (parsed.data.garda_vetting_status === 'rejected') {
    sendNotification({
      userId: profileId,
      type: 'vetting_update',
      title: 'Garda Vetting Update — Action Required',
    });
  }

  // Email provider on actionable status transitions — fire-and-forget
  const emailableStatuses = ['approved', 'rejected'] as const;
  type EmailableStatus = typeof emailableStatuses[number];
  if (emailableStatuses.includes(parsed.data.garda_vetting_status as EmailableStatus)) {
    void (async () => {
      try {
        const { data: providerProfile } = await service
          .from('profiles')
          .select('email,full_name')
          .eq('id', profileId)
          .maybeSingle();
        if (providerProfile?.email) {
          sendTransactionalEmail({
            type: 'garda_vetting_status',
            to: providerProfile.email,
            providerName: providerProfile.full_name ?? 'Provider',
            status: parsed.data.garda_vetting_status as EmailableStatus,
            expiresAt: parsed.data.garda_vetting_expires_at ?? undefined,
          });
        }
      } catch {
        // Non-blocking — email lookup failure is swallowed.
      }
    })();
  }

  return NextResponse.json({ profile: updated });
}

// GET /api/admin/garda-vetting/[profileId] — get vetting status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = getSupabaseServiceClient();
  const { data: profile, error } = await service
    .from('profiles')
    .select('id,full_name,garda_vetting_status,garda_vetting_reference,garda_vetting_expires_at')
    .eq('id', profileId)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
