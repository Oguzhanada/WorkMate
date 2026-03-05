import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticatePublicRequest } from '@/lib/api/public-auth';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

const webhookEvents = [
  'job.created',
  'quote.accepted',
  'payment.completed',
  'provider.approved',
  'document.verified',
  'document.rejected',
] as const;

const schema = z.object({
  url: z.string().url().refine((value) => value.startsWith('https://'), 'Webhook URL must use HTTPS.'),
  events: z.array(z.enum(webhookEvents)).min(1).max(10),
});

export async function POST(request: NextRequest) {
  const auth = await authenticatePublicRequest(request);
  if (auth.error) return auth.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = schema.safeParse(rawBody);
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
