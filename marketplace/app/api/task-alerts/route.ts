import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { upsertTaskAlertSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/api/error-response';

async function getVerifiedPro(supabase: ReturnType<typeof getSupabaseServiceClient>, userId: string) {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['verified_pro', 'admin'])
    .limit(1)
    .maybeSingle();
  return data !== null;
}

// GET — fetch own task alert preferences
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const { data } = await supabase
    .from('task_alerts')
    .select('*')
    .eq('provider_id', user.id)
    .maybeSingle();

  return NextResponse.json({ alert: data ?? null }, { status: 200 });
}

// POST — create or update task alert preferences (upsert)
async function postHandler(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const service = getSupabaseServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  const isPro = await getVerifiedPro(service, user.id);
  if (!isPro) return apiForbidden('Only verified providers can set task alerts.');

  let raw: unknown;
  try { raw = await request.json(); } catch {
    return apiError('Invalid JSON', 400);
  }

  const parsed = upsertTaskAlertSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { keywords, categories, counties, budget_min, enabled } = parsed.data;

  const { data, error } = await service
    .from('task_alerts')
    .upsert(
      { provider_id: user.id, keywords, categories, counties, budget_min, enabled },
      { onConflict: 'provider_id' }
    )
    .select('*')
    .single();

  if (error) return apiServerError(error.message);

  return NextResponse.json({ alert: data }, { status: 200 });
}

// DELETE — remove task alert
async function deleteHandler() {
  const supabase = await getSupabaseRouteClient();
  const service = getSupabaseServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiUnauthorized();

  await service.from('task_alerts').delete().eq('provider_id', user.id);

  return NextResponse.json({ success: true }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
