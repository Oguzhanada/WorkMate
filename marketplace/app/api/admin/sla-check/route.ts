/**
 * GET /api/admin/sla-check  (Vercel Cron — runs hourly)
 * POST /api/admin/sla-check (manual trigger)
 *
 * Notifies all admins about job listings pending review for >24 hours.
 * Secured via Authorization: Bearer <TASK_ALERT_SECRET>.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiUnauthorized, apiServerError } from '@/lib/api/error-response';
import { withRequestId } from '@/lib/request-id/middleware';

const SLA_HOURS = 24;

async function runSlaCheck(request: NextRequest): Promise<NextResponse> {
  // Vercel Cron injects Authorization: Bearer <CRON_SECRET> automatically.
  // Manual triggers use TASK_ALERT_SECRET. Either is accepted.
  const secret = process.env.CRON_SECRET ?? process.env.TASK_ALERT_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!secret || token !== secret) {
    return apiUnauthorized();
  }

  const supabase = getSupabaseServiceClient();
  const cutoff = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000).toISOString();

  const [{ data: overdueJobs }, { data: adminRoles }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id,title,created_at')
      .eq('review_status', 'pending_review')
      .lt('created_at', cutoff),
    supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin'),
  ]);

  if (!overdueJobs || overdueJobs.length === 0) {
    return NextResponse.json({ notified: 0, message: 'No overdue jobs.' }, { status: 200 });
  }

  const adminIds = (adminRoles ?? []).map((row) => row.user_id);
  if (adminIds.length === 0) {
    return NextResponse.json({ notified: 0, message: 'No admin accounts found.' }, { status: 200 });
  }

  const notifications = adminIds.map((adminId) => ({
    user_id: adminId,
    type: 'admin_sla_reminder',
    payload: {
      overdue_count: overdueJobs.length,
      overdue_job_ids: overdueJobs.map((j) => j.id),
      message: `${overdueJobs.length} job listing${overdueJobs.length > 1 ? 's have' : ' has'} been pending review for over ${SLA_HOURS} hours.`,
      action_url: '/en/dashboard/admin/jobs',
    },
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) {
    return apiServerError(error.message);
  }

  return NextResponse.json(
    { notified: adminIds.length, overdue_count: overdueJobs.length },
    { status: 200 }
  );
}

export const GET = withRequestId(runSlaCheck);
export const POST = withRequestId(runSlaCheck);
