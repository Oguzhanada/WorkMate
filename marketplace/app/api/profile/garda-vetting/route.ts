import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canQuote, getUserRoles } from '@/lib/auth/rbac';
import { requestGardaVettingSchema } from '@/lib/validation/api';
import { sendNotification } from '@/lib/notifications/send';

// GET /api/profile/garda-vetting — returns current user's vetting status
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return NextResponse.json({ error: 'Forbidden: verified_pro role required' }, { status: 403 });
  }

  const service = getSupabaseServiceClient();
  const { data: profile, error } = await service
    .from('profiles')
    .select('garda_vetting_status, garda_vetting_reference, garda_vetting_expires_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({
    garda_vetting_status: profile.garda_vetting_status ?? 'not_required',
    garda_vetting_reference: profile.garda_vetting_reference ?? null,
    garda_vetting_expires_at: profile.garda_vetting_expires_at ?? null,
  });
}

// POST /api/profile/garda-vetting — provider submits a vetting request
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return NextResponse.json({ error: 'Forbidden: verified_pro role required' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    rawBody = {};
  }

  const parsed = requestGardaVettingSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const service = getSupabaseServiceClient();

  // Read current status — only allow requesting if not already pending or approved
  const { data: current } = await service
    .from('profiles')
    .select('garda_vetting_status')
    .eq('id', user.id)
    .maybeSingle();

  const currentStatus = current?.garda_vetting_status ?? 'not_required';
  if (currentStatus === 'pending') {
    return NextResponse.json(
      { error: 'A vetting request is already under review.' },
      { status: 409 }
    );
  }
  if (currentStatus === 'approved') {
    return NextResponse.json(
      { error: 'Garda vetting is already approved.' },
      { status: 409 }
    );
  }

  const { data: updated, error: updateError } = await service
    .from('profiles')
    .update({
      garda_vetting_status: 'pending',
      garda_vetting_reference: parsed.data.reference_number ?? null,
    })
    .eq('id', user.id)
    .select('garda_vetting_status, garda_vetting_reference, garda_vetting_expires_at')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // In-app notification confirming the request was received — fire-and-forget
  sendNotification({
    userId: user.id,
    type: 'system',
    title: 'Garda Vetting Request Received',
    body: 'Your Garda vetting request is under review. We will notify you once a decision has been made.',
  });

  return NextResponse.json({ profile: updated }, { status: 200 });
}
