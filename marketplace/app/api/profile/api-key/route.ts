import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { hashApiKey } from '@/lib/api/public-auth';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

const ALLOWED_ROLES = new Set(['customer', 'verified_pro', 'admin']);

function isApiKeyRoleAllowed(roles: string[]) {
  return roles.some((role) => ALLOWED_ROLES.has(role));
}

function createApiKey() {
  return `wm_live_${randomBytes(24).toString('hex')}`;
}

async function postHandler(_req: NextRequest): Promise<NextResponse> {
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
  const plaintext = createApiKey();
  const keyHash = hashApiKey(plaintext);

  const { data, error } = await service
    .from('profiles')
    .update({ api_key_hash: keyHash })
    .eq('id', user.id)
    .select('id, api_rate_limit')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Return plaintext key once — it is never stored and cannot be retrieved again
  return NextResponse.json({ api_key: plaintext, api_rate_limit: data.api_rate_limit }, { status: 200 });
}

async function deleteHandler(_req: NextRequest): Promise<NextResponse> {
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
  const { error } = await service
    .from('profiles')
    .update({ api_key_hash: null })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.AUTH_ENDPOINT, postHandler);
export const DELETE = withRateLimit(RATE_LIMITS.AUTH_ENDPOINT, deleteHandler);
