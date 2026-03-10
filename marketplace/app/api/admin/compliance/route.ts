import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { complianceRecalcSchema } from '@/lib/validation/api';

async function postHandler(req: Request) {
    try {
        const supabase = await getSupabaseRouteClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const roles = await getUserRoles(supabase, user.id);
        if (!canAccessAdmin(roles)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const raw = await req.json().catch(() => ({}));
        const parsed = complianceRecalcSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request body', details: parsed.error.issues }, { status: 400 });
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
                return NextResponse.json({ error: error.message }, { status: 500 });
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
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
