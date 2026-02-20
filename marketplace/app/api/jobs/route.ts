import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { isValidEircode, normalizeEircode } from '@/lib/eircode';
import { createJobSchema } from '@/lib/validation/api';

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const eircode = normalizeEircode(body.eircode || '');

  if (!isValidEircode(eircode)) {
    return NextResponse.json({ error: 'Geçerli bir Eircode giriniz.' }, { status: 400 });
  }

  const { data, error } = await supabase.from('jobs').insert({
    customer_id: user.id,
    title: body.title,
    category: body.category,
    description: body.description,
    eircode,
    budget_range: body.budget_range,
    photo_urls: body.photo_urls,
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data }, { status: 201 });
}
