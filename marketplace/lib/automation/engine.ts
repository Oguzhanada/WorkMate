import { getSupabaseServiceClient } from '@/lib/supabase/service';

// ── Types ──────────────────────────────────────────────────────────────────

export type AutomationEvent =
  | 'document_verified'
  | 'document_rejected'
  | 'job_created'
  | 'quote_received'
  | 'job_inactive'
  | 'provider_approved';

/** Flat string/number context passed from the triggering API route */
export type AutomationContext = Record<string, string | number | null | undefined>;

type RuleRow = {
  id: string;
  trigger_event: AutomationEvent;
  conditions: Record<string, string>;
  action_type: 'send_notification' | 'change_status' | 'create_task';
  action_config: Record<string, unknown>;
  enabled: boolean;
};

// ── Condition matching ─────────────────────────────────────────────────────

/**
 * Returns true when ALL entries in `conditions` match the event context.
 * An empty (or null) conditions object always matches.
 */
function matchesCondition(
  conditions: Record<string, string> | null | undefined,
  context: AutomationContext
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [key, expected] of Object.entries(conditions)) {
    const actual = context[key];
    if (actual === undefined || actual === null) return false;
    if (String(actual) !== String(expected)) return false;
  }
  return true;
}

// ── Action execution ───────────────────────────────────────────────────────

async function executeAction(
  rule: RuleRow,
  context: AutomationContext,
  svc: ReturnType<typeof getSupabaseServiceClient>
): Promise<void> {
  const cfg = rule.action_config;

  if (rule.action_type === 'send_notification') {
    const recipient = (cfg.recipient as string) ?? 'all_admins';
    const message = (cfg.message as string) ?? `Automation rule fired: ${rule.trigger_event}`;
    const notifType = (cfg.notification_type as string) ?? 'automation_event';

    const payload = {
      rule_id: rule.id,
      trigger: rule.trigger_event,
      message,
      context,
      fired_at: new Date().toISOString(),
    };

    if (recipient === 'all_admins') {
      const { data: adminRows } = await svc
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if ((adminRows ?? []).length > 0) {
        await svc.from('notifications').insert(
          (adminRows ?? []).map((r) => ({
            user_id: r.user_id,
            type: notifType,
            payload,
          }))
        );
      }
    } else if (recipient === 'customer' && context.customerId) {
      await svc.from('notifications').insert({
        user_id: String(context.customerId),
        type: notifType,
        payload,
      });
    } else if (recipient === 'provider' && context.profileId) {
      await svc.from('notifications').insert({
        user_id: String(context.profileId),
        type: notifType,
        payload,
      });
    } else if (recipient === 'pro' && context.proId) {
      await svc.from('notifications').insert({
        user_id: String(context.proId),
        type: notifType,
        payload,
      });
    }
  } else if (rule.action_type === 'change_status') {
    const table = cfg.table as string;
    const idField = (cfg.id_field as string) ?? 'id';
    const idValue = (cfg.id_value as string) ?? String(context.jobId ?? context.profileId ?? '');
    const statusField = (cfg.status_field as string) ?? 'status';
    const statusValue = cfg.status_value as string;

    if (table && idValue && statusValue) {
      // Limited to the two tables automation rules may safely mutate
      if (table === 'jobs' || table === 'profiles') {
        await svc
          .from(table)
          .update({ [statusField]: statusValue })
          .eq(idField, idValue);
      }
    }
  } else if (rule.action_type === 'create_task') {
    const jobId = (cfg.job_id as string) ?? String(context.jobId ?? '');
    const description =
      (cfg.description as string) ?? `Automated task: ${rule.trigger_event}`;

    if (jobId && description) {
      await svc.from('job_todos').insert({
        job_id: jobId,
        description,
        created_by: null, // system-created
      });
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Fire automation rules matching the given event and context.
 * Non-blocking — catches all errors so it never breaks the calling route.
 */
export async function fireAutomationEvent(
  event: AutomationEvent,
  context: AutomationContext
): Promise<void> {
  try {
    const svc = getSupabaseServiceClient();

    const { data: rules, error } = await svc
      .from('automation_rules')
      .select('id,trigger_event,conditions,action_type,action_config,enabled')
      .eq('trigger_event', event)
      .eq('enabled', true);

    if (error || !rules || rules.length === 0) return;

    for (const rule of rules) {
      if (matchesCondition(rule.conditions as Record<string, string>, context)) {
        await executeAction(rule as RuleRow, context, svc);
      }
    }
  } catch {
    // Non-blocking: automation failures must not disrupt the main API flow
  }
}
