import { NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

type RoleRow = { user_id: string; role: string };

function maskHash(value: string | null) {
  if (!value) return null;
  return `${value.slice(0, 8)}...`;
}

export async function GET() {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const svc = getSupabaseServiceClient();
  const { data: profiles, error } = await svc
    .from('profiles')
    .select('id,full_name,api_key_hash,api_rate_limit,created_at')
    .not('api_key_hash', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profileIds = (profiles ?? []).map((item) => item.id);
  const { data: roleRows } = profileIds.length
    ? await svc.from('user_roles').select('user_id,role').in('user_id', profileIds)
    : { data: [] as RoleRow[] };

  const rolesByUser = new Map<string, string[]>();
  for (const row of roleRows ?? []) {
    const current = rolesByUser.get(row.user_id) ?? [];
    if (!current.includes(row.role)) current.push(row.role);
    rolesByUser.set(row.user_id, current);
  }

  return NextResponse.json(
    {
      items: (profiles ?? []).map((item) => ({
        id: item.id,
        full_name: item.full_name,
        api_key_hash_prefix: maskHash(item.api_key_hash),
        api_rate_limit: item.api_rate_limit,
        roles: rolesByUser.get(item.id) ?? [],
        created_at: item.created_at,
      })),
    },
    { status: 200 }
  );
}
