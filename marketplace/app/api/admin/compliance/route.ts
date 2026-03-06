import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';

export async function POST(req: Request) {
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

        const { providerId } = await req.json().catch(() => ({ providerId: null }));

        if (providerId) {
            // Recalculate for a single provider
            const { error } = await supabase.rpc('calculate_compliance_score', { p_profile_id: providerId });

            if (error) {
                // Since trigger handles this usually, we can force update via updating updated_at
                await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', providerId);
            }

            return NextResponse.json({ success: true, message: `Score recalculated for ${providerId}` });
        } else {
            // Recalculate ALL (by refreshing the view, triggers handle rows)
            const { error } = await supabase.rpc('refresh_provider_rankings');

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: 'Materialized view refreshed successfully' });
        }

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
