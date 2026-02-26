import type { SupabaseClient } from '@supabase/supabase-js';

export type DisputeParticipantContext = {
  jobId: string;
  customerId: string;
  providerId: string | null;
};

export async function getDisputeParticipantContext(
  supabase: SupabaseClient,
  jobId: string
): Promise<DisputeParticipantContext | null> {
  const { data: job } = await supabase
    .from('jobs')
    .select('id,customer_id,accepted_quote_id')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) return null;

  let providerId: string | null = null;
  if (job.accepted_quote_id) {
    const { data: quote } = await supabase
      .from('quotes')
      .select('pro_id')
      .eq('id', job.accepted_quote_id)
      .maybeSingle();
    providerId = quote?.pro_id ?? null;
  }

  return {
    jobId: job.id,
    customerId: job.customer_id,
    providerId,
  };
}

export function isDisputeParticipant(userId: string, context: DisputeParticipantContext) {
  return userId === context.customerId || userId === context.providerId;
}