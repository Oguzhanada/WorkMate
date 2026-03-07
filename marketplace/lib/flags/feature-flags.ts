import { getSupabaseServiceClient } from '@/lib/supabase/service';

// Server-side feature flag checker.
// Usage: const enabled = await isFeatureEnabled('ai_job_description');
export async function isFeatureEnabled(
  flagKey: string,
  userId?: string,
  userRoles?: string[]
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { data: flag } = await supabase
    .from('feature_flags')
    .select('enabled,enabled_for_roles,enabled_for_ids')
    .eq('flag_key', flagKey)
    .maybeSingle();

  if (!flag) return false;

  // Globally enabled
  if (flag.enabled) return true;

  // Enabled for specific user
  if (userId && (flag.enabled_for_ids as string[]).includes(userId)) return true;

  // Enabled for specific roles
  if (userRoles && (flag.enabled_for_roles as string[]).some((role) => userRoles.includes(role))) {
    return true;
  }

  return false;
}

// Batch fetch all flags for admin panel
export async function getAllFeatureFlags() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('feature_flags')
    .select('id,flag_key,description,enabled,enabled_for_roles,enabled_for_ids,updated_at')
    .order('flag_key', { ascending: true });

  if (error) return [];
  return data ?? [];
}
