import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiError } from '@/lib/api/error-response';

// GET /api/providers/[providerId]/services
// Returns the category IDs registered to a provider, plus their display name.
// Public — no auth required (used on the post-job form to scope category choices).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;

  const service = getSupabaseServiceClient();

  const [{ data: services, error: servicesError }, { data: profile, error: profileError }] =
    await Promise.all([
      service
        .from('pro_services')
        .select('category_id')
        .eq('profile_id', providerId),
      service
        .from('profiles')
        .select('full_name')
        .eq('id', providerId)
        .maybeSingle(),
    ]);

  if (servicesError || profileError) {
    return apiError(servicesError?.message ?? profileError?.message ?? 'Failed to load provider services', 400);
  }

  return NextResponse.json({
    category_ids: (services ?? []).map((row) => row.category_id),
    provider_name: profile?.full_name ?? null,
  });
}
