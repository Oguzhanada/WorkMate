import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

const schema = z.object({
  api_rate_limit: z.number().int().min(1).max(500000),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { profileId } = await params;
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
  const { data, error } = await svc
    .from('profiles')
    .update({ api_rate_limit: parsed.data.api_rate_limit })
    .eq('id', profileId)
    .select('id,api_rate_limit')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  return NextResponse.json({ profile: data }, { status: 200 });
}
