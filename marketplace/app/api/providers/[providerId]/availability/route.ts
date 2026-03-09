import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

// GET /api/providers/[providerId]/availability
// Public — no auth required. Returns weekly availability schedule for a provider.
// Used on public provider profile pages and by customers browsing schedules.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;

  if (!providerId || !/^[0-9a-f-]{36}$/i.test(providerId)) {
    return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 });
  }

  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from('provider_availability')
    .select('day_of_week, start_time, end_time, is_available')
    .eq('provider_id', providerId)
    .order('day_of_week', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ availability: data ?? [] }, { status: 200 });
}
