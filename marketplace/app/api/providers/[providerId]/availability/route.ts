import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiError } from '@/lib/api/error-response';
import { withRequestId } from '@/lib/request-id/middleware';

// GET /api/providers/[providerId]/availability
// Public — no auth required. Returns weekly availability schedule for a provider.
// Used on public provider profile pages and by customers browsing schedules.
export const GET = withRequestId(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;

  if (!providerId || !/^[0-9a-f-]{36}$/i.test(providerId)) {
    return apiError('Invalid provider ID', 400);
  }

  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from('provider_availability')
    .select('day_of_week, start_time, end_time, is_available')
    .eq('provider_id', providerId)
    .order('day_of_week', { ascending: true });

  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json({ availability: data ?? [] }, { status: 200 });
});
