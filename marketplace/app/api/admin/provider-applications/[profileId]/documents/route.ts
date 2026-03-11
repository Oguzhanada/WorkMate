import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { logAdminAudit } from '@/lib/admin/audit';
import { adminDocumentDecisionSchema } from '@/lib/validation/api';
import { PROVIDER_REQUIRED_DOCUMENTS } from '@/lib/data/documents';
import { fireAutomationEvent } from '@/lib/automation/engine';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiNotFound } from '@/lib/api/error-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { profileId } = await params;
  const { supabase } = auth;

  const { data: docs, error } = await supabase
    .from('pro_documents')
    .select('id,document_type,storage_path,verification_status,expires_at,rejection_reason,metadata,created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    return apiError(error.message, 400);
  }

  const serviceClient = getSupabaseServiceClient();
  const withUrls = await Promise.all(
    (docs ?? []).map(async (doc) => {
      const { data: signed, error: signedError } = await serviceClient.storage
        .from('pro-documents')
        .createSignedUrl(doc.storage_path, 60 * 10);

      const lower = doc.storage_path.toLowerCase();
      const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg');
      const fileName = doc.storage_path.split('/').pop() ?? `${doc.document_type}.pdf`;
      const downloadUrl =
        signedError || !signed?.signedUrl
          ? null
          : `${signed.signedUrl}${signed.signedUrl.includes('?') ? '&' : '?'}download=${encodeURIComponent(fileName)}`;
      return {
        ...doc,
        signed_url: signedError ? null : signed?.signedUrl ?? null,
        download_url: downloadUrl,
        preview_url: signedError || !isImage ? null : signed?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ documents: withUrls });
}

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { profileId } = await params;
  const serviceClient = getSupabaseServiceClient();

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = adminDocumentDecisionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { document_id, decision, note } = parsed.data;
  const mappedStatus = decision === 'approve' ? 'verified' : 'rejected';

  const { data: doc, error: docError } = await serviceClient
    .from('pro_documents')
    .update({
      verification_status: mappedStatus,
      reviewed_by: auth.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      rejection_reason: decision === 'approve' ? null : note || 'Please update this document and re-upload.',
    })
    .eq('id', document_id)
    .eq('profile_id', profileId)
    .select('id,document_type,verification_status,storage_path')
    .maybeSingle();

  if (docError) {
    return apiError(docError.message, 400);
  }

  if (!doc) {
    return apiNotFound('Document not found for profile');
  }

  const { data: existing } = await serviceClient
    .from('profiles')
    .select('stripe_requirements_due')
    .eq('id', profileId)
    .maybeSingle();

  const reviewState = {
    ...((existing?.stripe_requirements_due as Record<string, unknown>) ?? {}),
    admin_review: {
      ...((existing?.stripe_requirements_due as Record<string, Record<string, unknown>>)?.admin_review ??
        {}),
      document_review: {
        document_id,
        document_type: doc.document_type,
        decision,
        note,
        reviewed_at: new Date().toISOString(),
      },
    },
  };

  const identityPatch =
    doc.document_type === 'id_verification'
      ? decision === 'approve'
        ? {
            id_verification_status: 'approved',
            id_verification_rejected_reason: null,
            id_verification_reviewed_by: auth.user?.id ?? null,
            id_verification_reviewed_at: new Date().toISOString(),
          }
        : {
            id_verification_status: 'rejected',
            id_verification_rejected_reason: note || 'Please upload a valid ID document.',
            id_verification_reviewed_by: auth.user?.id ?? null,
            id_verification_reviewed_at: new Date().toISOString(),
          }
      : {};

  const { error: profileUpdateError } = await serviceClient
    .from('profiles')
    .update({
      verification_status: 'pending',
      is_verified: false,
      stripe_requirements_due: reviewState,
      ...identityPatch,
    })
    .eq('id', profileId);

  if (profileUpdateError) {
    return apiError(profileUpdateError.message, 400);
  }

  if (decision !== 'approve') {
    if (doc.document_type === 'id_verification' && doc.storage_path) {
      await serviceClient
        .from('pro_documents')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', document_id)
        .eq('profile_id', profileId);

      await serviceClient
        .from('profiles')
        .update({ id_verification_document_url: null })
        .eq('id', profileId);
    }

    const { error: removeRoleError } = await serviceClient
      .from('user_roles')
      .delete()
      .eq('user_id', profileId)
      .eq('role', 'verified_pro');

    if (removeRoleError) {
      return apiError(removeRoleError.message, 400);
    }
  }

  const { error: notificationError } = await serviceClient.from('notifications').insert({
    user_id: profileId,
    type: 'admin_document_update',
    payload: {
      document_id,
      document_type: doc.document_type,
      decision,
      note,
      status: mappedStatus,
      reviewed_at: new Date().toISOString(),
    },
  });

  if (notificationError) {
    return apiError(notificationError.message, 400);
  }

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: decision === 'approve' ? 'document_approved' : decision === 'reject' ? 'document_rejected' : 'document_resubmission_requested',
    targetType: 'document_review',
    targetProfileId: profileId,
    details: {
      document_id,
      document_type: doc.document_type,
      note,
      status: mappedStatus,
      reviewed_at: new Date().toISOString(),
    },
  });

  // Fire automation rules — non-blocking
  void fireAutomationEvent(
    decision === 'approve' ? 'document_verified' : 'document_rejected',
    {
      profileId,
      documentId: document_id,
      documentType: doc.document_type,
      decision,
      rejectionReason: decision !== 'approve' ? (note ?? '') : undefined,
    }
  );

  return NextResponse.json({ document: doc });
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { profileId } = await params;
  const serviceClient = getSupabaseServiceClient();

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // optional body
  }
  const note =
    typeof body === 'object' && body !== null && 'note' in body && typeof (body as { note?: unknown }).note === 'string'
      ? ((body as { note: string }).note ?? '')
      : 'All required documents verified in bulk.';

  const { data: docs, error: docsError } = await serviceClient
    .from('pro_documents')
    .select('id,document_type')
    .eq('profile_id', profileId);

  if (docsError) {
    return apiError(docsError.message, 400);
  }

  const required = new Set(PROVIDER_REQUIRED_DOCUMENTS);
  const targetDocIds = (docs ?? [])
    .filter((doc) => required.has(doc.document_type as (typeof PROVIDER_REQUIRED_DOCUMENTS)[number]))
    .map((doc) => doc.id);

  if (targetDocIds.length === 0) {
    return apiError('No required documents found for this profile.', 400);
  }

  const { error: updateError } = await serviceClient
    .from('pro_documents')
    .update({
      verification_status: 'verified',
      reviewed_by: auth.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .in('id', targetDocIds)
    .eq('profile_id', profileId);

  if (updateError) {
    return apiError(updateError.message, 400);
  }

  await serviceClient.from('notifications').insert({
    user_id: profileId,
    type: 'admin_document_update',
    payload: {
      decision: 'approve_all',
      note,
      reviewed_at: new Date().toISOString(),
      document_count: targetDocIds.length,
    },
  });

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: 'documents_bulk_approved',
    targetType: 'document_review',
    targetProfileId: profileId,
    details: {
      note,
      document_ids: targetDocIds,
      reviewed_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({ updated: targetDocIds.length });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
