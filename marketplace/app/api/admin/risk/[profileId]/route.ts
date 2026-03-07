import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';

// Risk thresholds
const RISK_WEIGHTS = {
  dispute_count: 15,         // per open dispute
  unresolved_dispute: 25,    // per unresolved/escalated dispute
  payment_failure: 10,       // per failed payment in last 30 days
  no_documents: 20,          // no verified documents
  id_not_verified: 15,       // id_verification_status != 'approved'
  low_compliance: 10,        // compliance_score < 60
  recent_complaints: 20,     // reviews with rating <= 2 in last 90 days
  account_age_days: 0,       // informational only
} as const;

async function computeRiskScore(profileId: string) {
  const service = getSupabaseServiceClient();
  const flags: string[] = [];
  let score = 0;

  // Fetch profile
  const { data: profile } = await service
    .from('profiles')
    .select('id,compliance_score,id_verification_status,created_at')
    .eq('id', profileId)
    .maybeSingle();

  if (!profile) return null;

  // Check ID verification
  if (profile.id_verification_status !== 'approved') {
    flags.push('id_not_verified');
    score += RISK_WEIGHTS.id_not_verified;
  }

  // Check compliance score
  if (profile.compliance_score != null && profile.compliance_score < 60) {
    flags.push('low_compliance_score');
    score += RISK_WEIGHTS.low_compliance;
  }

  // Check verified documents
  const { data: docs } = await service
    .from('pro_documents')
    .select('id')
    .eq('profile_id', profileId)
    .eq('verification_status', 'verified')
    .is('archived_at', null)
    .limit(1);

  if (!docs || docs.length === 0) {
    flags.push('no_verified_documents');
    score += RISK_WEIGHTS.no_documents;
  }

  // Check disputes
  const { data: disputes } = await service
    .from('disputes')
    .select('id,status')
    .or(`customer_id.eq.${profileId},provider_id.eq.${profileId}`);

  const openDisputes = (disputes ?? []).filter((d) => d.status === 'open').length;
  const unresolvedDisputes = (disputes ?? []).filter((d) =>
    ['escalated', 'pending_evidence'].includes(d.status)
  ).length;

  if (openDisputes > 0) {
    flags.push(`open_disputes_${openDisputes}`);
    score += openDisputes * RISK_WEIGHTS.dispute_count;
  }
  if (unresolvedDisputes > 0) {
    flags.push(`unresolved_disputes_${unresolvedDisputes}`);
    score += unresolvedDisputes * RISK_WEIGHTS.unresolved_dispute;
  }

  // Check recent low ratings (last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count: lowRatingCount } = await service
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('pro_id', profileId)
    .lte('rating', 2)
    .gte('created_at', ninetyDaysAgo);

  if ((lowRatingCount ?? 0) > 0) {
    flags.push(`low_ratings_90d_${lowRatingCount}`);
    score += RISK_WEIGHTS.recent_complaints;
  }

  // Cap at 100
  score = Math.min(100, score);

  return { score, flags };
}

// GET /api/admin/risk/[profileId] — compute and return risk assessment
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await computeRiskScore(profileId);
  if (!result) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profileId, risk_score: result.score, risk_flags: result.flags });
}

// POST /api/admin/risk/[profileId] — compute, persist, and return risk assessment
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await computeRiskScore(profileId);
  if (!result) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const service = getSupabaseServiceClient();
  const { error: updateError } = await service
    .from('profiles')
    .update({
      risk_score: result.score,
      risk_flags: result.flags,
      risk_reviewed_at: new Date().toISOString(),
    })
    .eq('id', profileId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({
    profileId,
    risk_score: result.score,
    risk_flags: result.flags,
    risk_reviewed_at: new Date().toISOString(),
  });
}
