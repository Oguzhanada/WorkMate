import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { runAllHealthChecks } from '@/lib/monitoring/health-checks';

/**
 * GET /api/health
 *
 * Basic mode (default):
 *   Public health check for uptime monitors (UptimeRobot, etc.).
 *   Returns 200 if app + database are reachable, 503 otherwise.
 *
 * Detailed mode (?detailed=true):
 *   Admin-only. Returns full service status map for all integrations.
 *   Non-admin requests get 403 with no internal details leaked.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const detailed = searchParams.get('detailed') === 'true';

  // ── Detailed mode: admin-only ─────────────────────────────────────────────
  if (detailed) {
    try {
      const supabase = await getSupabaseRouteClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const roles = await getUserRoles(supabase, user.id);
      if (!canAccessAdmin(roles)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const skipCache = searchParams.get('fresh') === 'true';
      const result = await runAllHealthChecks({ skipCache });

      return NextResponse.json(result, {
        status: result.status === 'down' ? 503 : 200,
      });
    } catch (err) {
      return NextResponse.json(
        {
          error: 'Health check failed',
          message: err instanceof Error ? err.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }

  // ── Basic mode: public ────────────────────────────────────────────────────
  const start = Date.now();

  try {
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'degraded',
          database: 'unreachable',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      latency_ms: Date.now() - start,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
