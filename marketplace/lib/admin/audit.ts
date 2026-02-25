import { getSupabaseServiceClient } from '@/lib/supabase/service';

type AdminAuditInput = {
  adminUserId?: string | null;
  adminEmail?: string | null;
  action: string;
  targetType: string;
  targetProfileId?: string | null;
  targetLabel?: string | null;
  details?: Record<string, unknown>;
};

export async function logAdminAudit(input: AdminAuditInput) {
  const service = getSupabaseServiceClient();
  const { error } = await service.from('admin_audit_logs').insert({
    admin_user_id: input.adminUserId ?? null,
    admin_email: input.adminEmail ?? null,
    action: input.action,
    target_type: input.targetType,
    target_profile_id: input.targetProfileId ?? null,
    target_label: input.targetLabel ?? null,
    details: input.details ?? {},
  });

  return { error };
}
