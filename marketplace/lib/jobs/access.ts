import { getUserRoles } from '@/lib/auth/rbac';
import type { getSupabaseRouteClient } from '@/lib/supabase/route';

type RouteSupabase = Awaited<ReturnType<typeof getSupabaseRouteClient>>;

export type JobAccessContext = {
  exists: boolean;
  customerId: string | null;
  providerId: string | null;
  isCustomer: boolean;
  isProvider: boolean;
  isAdmin: boolean;
};

export async function resolveJobAccessContext(
  supabase: RouteSupabase,
  jobId: string,
  userId: string
): Promise<JobAccessContext> {
  const { data: job } = await supabase
    .from('jobs')
    .select('id,customer_id,accepted_quote_id')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) {
    return {
      exists: false,
      customerId: null,
      providerId: null,
      isCustomer: false,
      isProvider: false,
      isAdmin: false,
    };
  }

  let providerId: string | null = null;
  if (job.accepted_quote_id) {
    const { data: acceptedQuote } = await supabase
      .from('quotes')
      .select('pro_id')
      .eq('id', job.accepted_quote_id)
      .maybeSingle();
    providerId = acceptedQuote?.pro_id ?? null;
  }

  const roles = await getUserRoles(supabase, userId);
  const isAdmin = roles.includes('admin');

  return {
    exists: true,
    customerId: job.customer_id,
    providerId,
    isCustomer: userId === job.customer_id,
    isProvider: providerId === userId,
    isAdmin,
  };
}
