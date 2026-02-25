import type { SupabaseClient } from '@supabase/supabase-js';

export type AppRole = 'customer' | 'verified_pro' | 'admin';

const PRO_ROLES = new Set<AppRole>(['verified_pro', 'admin']);
const CUSTOMER_ROLES = new Set<AppRole>(['customer', 'admin']);

export function hasRole(roles: AppRole[], role: AppRole) {
  return roles.includes(role);
}

export function canPostJob(roles: AppRole[]) {
  return roles.some((role) => CUSTOMER_ROLES.has(role));
}

export function canQuote(roles: AppRole[]) {
  return roles.some((role) => PRO_ROLES.has(role));
}

export function canPostJobWithIdentity(roles: AppRole[], idVerificationStatus?: string | null) {
  return canPostJob(roles) && idVerificationStatus === 'approved';
}

export function canQuoteJob(roles: AppRole[], idVerificationStatus?: string | null) {
  return canQuote(roles) && idVerificationStatus === 'approved';
}

export function canAccessProDashboard(roles: AppRole[]) {
  return canQuote(roles);
}

export function canAccessAdmin(roles: AppRole[]) {
  return hasRole(roles, 'admin');
}

export async function getUserRoles(
  supabase: SupabaseClient,
  userId: string
): Promise<AppRole[]> {
  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (roleRows?.length) {
    const normalized = roleRows
      .map((row) => row.role as AppRole)
      .filter((value, index, all) => all.indexOf(value) === index);

    return normalized;
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profileRow?.role) {
    return [profileRow.role as AppRole];
  }

  return [];
}
