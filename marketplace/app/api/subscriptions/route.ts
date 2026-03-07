import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

// GET /api/subscriptions — get the current provider's subscription
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = getSupabaseServiceClient();
  const { data: subscription, error } = await service
    .from('provider_subscriptions')
    .select('id,provider_id,plan,status,current_period_start,current_period_end,cancel_at_period_end,created_at')
    .eq('provider_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return null subscription = basic plan (default for providers without a record)
  return NextResponse.json({
    subscription: subscription ?? {
      plan: 'basic',
      status: 'active',
      cancel_at_period_end: false,
    },
  });
}
