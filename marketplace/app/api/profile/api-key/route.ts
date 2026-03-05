import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

const ALLOWED_ROLES = new Set(['customer', 'verified_pro', 'admin']);

function isApiKeyRoleAllowed(roles: string[]) {
  return roles.some((role) => ALLOWED_ROLES.has(role));
}

function createApiKey() {
  return `wm_live_${randomBytes(24).toString('hex')}`;
}

export async function POST() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!isApiKeyRoleAllowed(roles)) {
    return NextResponse.json(
      { error: 'Only customer/provider/admin accounts can use API keys.' },
      { status: 403 }
    );
  }

  const service = getSupabaseServiceClient();
  const apiKey = createApiKey();
  const { data, error } = await service
    .from('profiles')
    .update({ api_key: apiKey })
    .eq('id', user.id)
    .select('id,api_key,api_rate_limit')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ profile: data }, { status: 200 });
}

export async function DELETE() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!isApiKeyRoleAllowed(roles)) {
    return NextResponse.json(
      { error: 'Only customer/provider/admin accounts can use API keys.' },
      { status: 403 }
    );
  }

  const service = getSupabaseServiceClient();
  const { error } = await service.from('profiles').update({ api_key: null }).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true }, { status: 200 });
}
