import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canQuote, getUserRoles } from '@/lib/auth/rbac';
import { calculateCompleteness } from '@/lib/profile/completeness';

// GET /api/profile/completeness
// Returns the profile completeness score for the authenticated provider.
// Only verified_pro and admin roles may call this endpoint.
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return NextResponse.json(
      { error: 'Forbidden: verified_pro role required' },
      { status: 403 },
    );
  }

  const service = getSupabaseServiceClient();

  const [{ data: profile, error: profileError }, { count: servicesCount, error: servicesError }] =
    await Promise.all([
      service
        .from('profiles')
        .select(
          'full_name,phone,avatar_url,county,locality,id_verification_status,garda_vetting_status,stripe_requirements_due',
        )
        .eq('id', user.id)
        .maybeSingle(),
      service
        .from('pro_services')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', user.id),
    ]);

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (servicesError) {
    return NextResponse.json({ error: servicesError.message }, { status: 500 });
  }

  const hasServices = (servicesCount ?? 0) > 0;
  const result = calculateCompleteness(profile, hasServices);

  return NextResponse.json(result);
}
