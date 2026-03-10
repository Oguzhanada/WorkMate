import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticatePublicRequest } from '@/lib/api/public-auth';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { webhookSubscribeSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function postHandler(request: NextRequest) {
  const auth = await authenticatePublicRequest(request);
  if (auth.error) return auth.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = webhookSubscribeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const svc = getSupabaseServiceClient();
  const secret = randomBytes(32).toString('hex');

  const { data, error } = await svc
    .from('webhook_subscriptions')
    .insert({
      profile_id: auth.profileId,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
      enabled: true,
    })
    .select('id,url,events,enabled,created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(
    {
      subscription: data,
      signing_secret: secret,
      note: 'Store signing_secret safely. It is shown only once.',
    },
    { status: 201 }
  );
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
