import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { runAllHealthChecks } from '@/lib/monitoring/health-checks';
import { getAllServiceStatuses } from '@/lib/resilience/service-status';
import { apiUnauthorized, apiForbidden, apiServerError } from '@/lib/api/error-response';

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
        return apiUnauthorized('Authentication required');
      }

      const roles = await getUserRoles(supabase, user.id);
      if (!canAccessAdmin(roles)) {
        return apiForbidden('Insufficient permissions');
      }

      const skipCache = searchParams.get('fresh') === 'true';
      const result = await runAllHealthChecks({ skipCache });

      return NextResponse.json(result, {
        status: result.status === 'down' ? 503 : 200,
      });
    } catch (err) {
      return apiServerError(err instanceof Error ? err.message : 'Health check failed');
    }
  }

  // ── Basic mode: public ────────────────────────────────────────────────────
  const start = Date.now();

  try {
    const supabase = getSupabaseServiceClient();

    // Lightweight connectivity check — limit(0) returns no rows, just tests the connection
    const { error: pingError } = await supabase
      .from('profiles')
      .select('id')
      .limit(0);

    const dbReachable = !pingError;

    if (!dbReachable) {
      return NextResponse.json(
        {
          status: 'degraded',
          db: 'unreachable',
          database: 'unreachable',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    const services = await getAllServiceStatuses();

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      database: 'connected',
      services,
      latency_ms: Date.now() - start,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        db: 'unreachable',
        database: 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
