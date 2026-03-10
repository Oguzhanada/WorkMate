import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canQuote, getUserRoles } from '@/lib/auth/rbac';
import { requestGardaVettingSchema } from '@/lib/validation/api';
import { sendNotification } from '@/lib/notifications/send';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

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

// POST /api/profile/garda-vetting — provider requests Garda Vetting via WorkMate
//
// How it works in reality:
// 1. Provider clicks "Request Garda Vetting" in their dashboard
// 2. This sets their status to "pending" in our DB
// 3. A WorkMate admin (or automated process) then submits a vetting invitation
//    to the NVB e-Vetting system on behalf of the provider
// 4. The NVB sends the provider an email (vetting@garda.ie) with a link
//    to complete the official e-Vetting form
// 5. After 2-4 weeks, the NVB returns the disclosure to WorkMate
// 6. An admin reviews and updates the status to 'approved' or 'rejected'
//
// Individuals cannot self-apply to the NVB — only registered organisations can.
// WorkMate acts as (or partners with) a registered organisation under the
// National Vetting Bureau (Children and Vulnerable Persons) Acts 2012-2016.
async function postHandler(request: NextRequest) {
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
    .select('garda_vetting_status, garda_vetting_expires_at')
    .eq('id', user.id)
    .maybeSingle();

  const currentStatus = current?.garda_vetting_status ?? 'not_required';

  if (currentStatus === 'pending') {
    return NextResponse.json(
      {
        error:
          'A vetting request is already in progress. Check your email for a message from vetting@garda.ie — you may need to complete the e-Vetting form.',
      },
      { status: 409 }
    );
  }

  // Allow re-vetting if approved and within 90 days of expiry
  if (currentStatus === 'approved') {
    const expiresAt = current?.garda_vetting_expires_at;
    if (expiresAt) {
      const daysUntilExpiry = Math.ceil(
        (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry > 90) {
        return NextResponse.json(
          {
            error:
              'Your Garda Vetting is currently valid. Re-vetting can be requested within 90 days of expiry.',
          },
          { status: 409 }
        );
      }
      // Within 90 days — allow re-vetting to proceed
    } else {
      return NextResponse.json(
        { error: 'Your Garda Vetting is currently approved.' },
        { status: 409 }
      );
    }
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
    return NextResponse.json({ error: 'Failed to submit request. Please try again.' }, { status: 500 });
  }

  // In-app notification confirming the request — fire-and-forget
  sendNotification({
    userId: user.id,
    type: 'system',
    title: 'Garda Vetting Request Received',
    body: 'Your request has been received. We will submit a vetting invitation to the National Vetting Bureau on your behalf. Expect an email from vetting@garda.ie within 1-3 business days with a link to complete the e-Vetting form. NVB processing typically takes 2-4 weeks.',
  });

  return NextResponse.json({ profile: updated }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
