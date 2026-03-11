import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { createGuestJobIntentSchema } from '@/lib/validation/api';
import { isValidEircode, normalizeEircode } from '@/lib/ireland/eircode';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function handler(request: NextRequest): Promise<NextResponse> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createGuestJobIntentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const eircode = normalizeEircode(body.eircode);
  if (!isValidEircode(eircode)) {
    return NextResponse.json({ error: 'Please enter a valid Eircode.' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: categoryRow, error: categoryError } = await supabase
    .from('categories')
    .select('id,name')
    .eq('id', body.category_id)
    .eq('is_active', true)
    .maybeSingle();

  if (categoryError || !categoryRow) {
    return NextResponse.json({ error: 'Invalid category selection' }, { status: 400 });
  }

  const token = randomUUID().replaceAll('-', '');

  // Email verification guard:
  // - REQUIRE_GUEST_EMAIL_VERIFICATION defaults to true in production.
  // - When enabled, the intent is created with status 'email_pending' and the guest
  //   must click a verification link (sent via email) before the job can be claimed.
  // - When disabled (dev/test), the intent is auto-verified and immediately claimable.
  // - Set REQUIRE_GUEST_EMAIL_VERIFICATION=false in .env.local to skip during development.
  const requireVerification =
    process.env.REQUIRE_GUEST_EMAIL_VERIFICATION !== 'false' &&
    process.env.NODE_ENV === 'production';

  const skipVerification = !requireVerification;

  const { data, error } = await supabase
    .from('job_intents')
    .insert({
      email: body.email.toLowerCase(),
      title: body.title,
      category_id: categoryRow.id,
      description: body.description,
      eircode,
      county: body.county,
      locality: body.locality,
      budget_range: body.budget_range,
      photo_urls: body.photo_urls,
      status: skipVerification ? 'ready_to_publish' : 'email_pending',
      verification_token: token,
      verified_at: skipVerification ? new Date().toISOString() : null,
    })
    .select('id,status')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Intent could not be created' }, { status: 400 });
  }

  return NextResponse.json(
    {
      intent_id: data.id,
      status: data.status,
      // When status is 'email_pending', the guest must click the email
      // verification link before the intent transitions to 'ready_to_publish'
      // and can be claimed via POST /api/guest-jobs/claim.
      verification_required: !skipVerification,
    },
    { status: 201 }
  );
}

export const POST = withRateLimit(RATE_LIMITS.AUTH_STRICT, handler);
