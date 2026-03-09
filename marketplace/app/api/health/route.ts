import { NextResponse } from 'next/server';

import { getSupabaseServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/health
 * Health check endpoint for uptime monitoring (UptimeRobot, etc.).
 * Returns 200 if the app and database are reachable, 503 otherwise.
 */
export async function GET() {
  const start = Date.now();

  try {
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'degraded',
          database: 'unreachable',
          error: error.message,
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
  } catch (err) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
