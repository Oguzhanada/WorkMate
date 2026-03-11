import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiUnauthorized, apiServerError } from '@/lib/api/error-response';

/**
 * GET /api/appointments
 *
 * Returns all appointments for the authenticated user (as provider or customer),
 * ordered by start_time ascending (upcoming first).
 */
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const service = getSupabaseServiceClient();

  const { data: rows, error: queryError } = await service
    .from('appointments')
    .select(
      `
      id,
      start_time,
      end_time,
      status,
      video_link,
      notes,
      provider_id,
      customer_id,
      jobs ( title ),
      provider:profiles!appointments_provider_id_fkey ( full_name ),
      customer:profiles!appointments_customer_id_fkey ( full_name )
      `
    )
    .or(`provider_id.eq.${user.id},customer_id.eq.${user.id}`)
    .order('start_time', { ascending: true });

  if (queryError) {
    return apiServerError(queryError.message);
  }

  return NextResponse.json({ appointments: rows ?? [] }, { status: 200 });
}
