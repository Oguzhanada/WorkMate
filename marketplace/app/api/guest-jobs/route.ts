import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { createGuestJobIntentSchema } from '@/lib/validation/api';
import { isValidEircode, normalizeEircode } from '@/lib/eircode';

export async function POST(request: NextRequest) {
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
  const devAutoVerify = process.env.NODE_ENV !== 'production';

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
      status: devAutoVerify ? 'ready_to_publish' : 'email_pending',
      verification_token: token,
      verified_at: devAutoVerify ? new Date().toISOString() : null,
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
      dev_auto_verified: devAutoVerify,
      prod_reminder:
        'PROD TODO: enable real email verification before publishing guest jobs. In test mode this step is bypassed.',
    },
    { status: 201 }
  );
}
