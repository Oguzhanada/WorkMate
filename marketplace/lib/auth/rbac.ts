import type { SupabaseClient } from '@supabase/supabase-js';

export type AppRole = 'customer' | 'verified_pro' | 'admin';

const PRO_ROLES = new Set<AppRole>(['verified_pro', 'admin']);

export function isProRole(role: AppRole | null | undefined) {
  return !!role && PRO_ROLES.has(role);
}

export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<AppRole | null> {
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (roleRow?.role) {
    return roleRow.role as AppRole;
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return (profileRow?.role as AppRole | undefined) ?? null;
}
