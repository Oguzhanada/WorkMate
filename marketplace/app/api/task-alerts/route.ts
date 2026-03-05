import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

const IRELAND_COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow', 'Ireland-wide',
] as const;

const upsertSchema = z.object({
  keywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  categories: z.array(z.string().uuid()).max(20).default([]),
  counties: z.array(z.enum(IRELAND_COUNTIES)).max(27).default([]),
  budget_min: z.number().int().min(0).nullable().default(null),
  enabled: z.boolean().default(true),
});

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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('task_alerts')
    .select('*')
    .eq('provider_id', user.id)
    .maybeSingle();

  return NextResponse.json({ alert: data ?? null }, { status: 200 });
}

// POST — create or update task alert preferences (upsert)
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const service = getSupabaseServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isPro = await getVerifiedPro(service, user.id);
  if (!isPro) return NextResponse.json({ error: 'Only verified providers can set task alerts.' }, { status: 403 });

  let raw: unknown;
  try { raw = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ alert: data }, { status: 200 });
}

// DELETE — remove task alert
export async function DELETE() {
  const supabase = await getSupabaseRouteClient();
  const service = getSupabaseServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await service.from('task_alerts').delete().eq('provider_id', user.id);

  return NextResponse.json({ success: true }, { status: 200 });
}
