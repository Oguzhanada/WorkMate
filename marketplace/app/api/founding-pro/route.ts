import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { claimFoundingProSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

// GET /api/founding-pro — check program status, slots, and user's founding pro / referral info
export async function GET() {
  const service = getSupabaseServiceClient();

  const { data: config, error } = await service
    .from('founding_pro_config')
    .select('max_slots,current_count,program_active')
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to load program status' }, { status: 500 });
  }

  const slots_remaining = config.max_slots - config.current_count;

  // Try to get authenticated user info (optional — works for both logged-in and anonymous)
  let user_status: {
    is_founding_pro: boolean;
    is_provider: boolean;
    is_authenticated: boolean;
    referral_code?: string;
    referral_uses?: number;
    referral_max_uses?: number;
    founding_pro_joined_at?: string;
  } = { is_founding_pro: false, is_provider: false, is_authenticated: false };

  try {
    const supabase = await getSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await service
        .from('profiles')
        .select('is_founding_pro,founding_pro_joined_at,role')
        .eq('id', user.id)
        .single();

      if (profile) {
        user_status = {
          is_founding_pro: profile.is_founding_pro ?? false,
          is_provider: profile.role === 'provider' || profile.role === 'admin',
          is_authenticated: true,
          founding_pro_joined_at: profile.founding_pro_joined_at ?? undefined,
        };

        // If founding pro, fetch referral code data
        if (profile.is_founding_pro) {
          const { data: referral } = await service
            .from('referral_codes')
            .select('code,uses_count,max_uses')
            .eq('profile_id', user.id)
            .single();

          if (referral) {
            user_status.referral_code = referral.code;
            user_status.referral_uses = referral.uses_count;
            user_status.referral_max_uses = referral.max_uses;
          }
        }
      }
    }
  } catch {
    // Non-critical — anonymous users just see program status
  }

  return NextResponse.json({
    program_active: config.program_active,
    max_slots: config.max_slots,
    current_count: config.current_count,
    slots_remaining: Math.max(0, slots_remaining),
    user_status,
  });
}

// POST /api/founding-pro — claim a founding pro slot (authenticated providers only)
// Body: { confirm: true }
async function postHandler(request: NextRequest) {
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

  const parsed = claimFoundingProSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const service = getSupabaseServiceClient();

  // Check if user is already a founding pro
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('is_founding_pro,role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }

  if (profile.is_founding_pro) {
    return NextResponse.json({ error: 'Already a Founding Pro' }, { status: 409 });
  }

  // Must be a provider (or admin)
  if (profile.role !== 'provider' && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Only providers can join the Founding Pro program' }, { status: 403 });
  }

  // Check program status and available slots
  const { data: config, error: configError } = await service
    .from('founding_pro_config')
    .select('id,max_slots,current_count,program_active')
    .limit(1)
    .single();

  if (configError || !config) {
    return NextResponse.json({ error: 'Failed to load program config' }, { status: 500 });
  }

  if (!config.program_active) {
    return NextResponse.json({ error: 'Founding Pro program is no longer active' }, { status: 410 });
  }

  if (config.current_count >= config.max_slots) {
    return NextResponse.json({ error: 'All Founding Pro slots have been claimed' }, { status: 410 });
  }

  // Claim the slot — update profile
  const { error: updateError } = await service
    .from('profiles')
    .update({
      is_founding_pro: true,
      founding_pro_joined_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to claim slot' }, { status: 500 });
  }

  // Increment counter
  const { error: counterError } = await service
    .from('founding_pro_config')
    .update({
      current_count: config.current_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', config.id);

  if (counterError) {
    // Best-effort — profile is already updated, counter is secondary
    console.error('[founding-pro] Failed to increment counter:', counterError.message);
  }

  // Deactivate program if slots are now full
  if (config.current_count + 1 >= config.max_slots) {
    await service
      .from('founding_pro_config')
      .update({ program_active: false, updated_at: new Date().toISOString() })
      .eq('id', config.id);
  }

  return NextResponse.json(
    {
      success: true,
      slot_number: config.current_count + 1,
      slots_remaining: Math.max(0, config.max_slots - config.current_count - 1),
    },
    { status: 201 }
  );
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
