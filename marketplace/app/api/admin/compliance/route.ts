import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { complianceRecalcSchema } from '@/lib/validation/api';
import { apiError, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/api/error-response';

async function postHandler(req: Request) {
    try {
        const supabase = await getSupabaseRouteClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return apiUnauthorized();
        }

        const roles = await getUserRoles(supabase, user.id);
        if (!canAccessAdmin(roles)) {
            return apiForbidden();
        }

        const raw = await req.json().catch(() => ({}));
        const parsed = complianceRecalcSchema.safeParse(raw);
        if (!parsed.success) {
            return apiError('Invalid request body', 400);
        }
        const { providerId } = parsed.data;

        if (providerId) {
            // Recalculate for a single provider
            const { error } = await supabase.rpc('calculate_compliance_score', { p_profile_id: providerId });

            if (error) {
                // Since trigger handles this usually, we can force update via updating updated_at
                await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', providerId);
            }

            await logAdminAudit({
                adminUserId: user.id,
                adminEmail: user.email ?? null,
                action: 'recalculate_compliance_score',
                targetType: 'compliance',
                targetProfileId: providerId,
                details: { provider_id: providerId },
            });

            return NextResponse.json({ success: true, message: `Score recalculated for ${providerId}` });
        } else {
            // Recalculate ALL (by refreshing the view, triggers handle rows)
            const { error } = await supabase.rpc('refresh_provider_rankings');

            if (error) {
                return apiServerError(error.message);
            }

            await logAdminAudit({
                adminUserId: user.id,
                adminEmail: user.email ?? null,
                action: 'refresh_provider_rankings',
                targetType: 'compliance',
                details: { scope: 'all_providers' },
            });

            return NextResponse.json({ success: true, message: 'Materialized view refreshed successfully' });
        }

    } catch (err: unknown) {
        console.error('Compliance recalculation failed:', err);
        return apiServerError();
    }
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
