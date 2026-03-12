import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { logAdminAudit } from '@/lib/admin/audit';
import { adminProviderDecisionSchema, adminProviderFiltersSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError } from '@/lib/api/error-response';

async function getHandler(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const parsedFilters = adminProviderFiltersSchema.safeParse({
    status: request.nextUrl.searchParams.get('status') ?? 'all',
    review_type: request.nextUrl.searchParams.get('review_type') ?? 'all',
    category: request.nextUrl.searchParams.get('category') ?? 'all',
    county: request.nextUrl.searchParams.get('county') ?? 'all',
    date_range: request.nextUrl.searchParams.get('date_range') ?? 'all',
    city: request.nextUrl.searchParams.get('city') ?? '',
    service: request.nextUrl.searchParams.get('service') ?? '',
    q: request.nextUrl.searchParams.get('q') ?? '',
    start_date: request.nextUrl.searchParams.get('start_date') ?? '',
    end_date: request.nextUrl.searchParams.get('end_date') ?? '',
    id_verification_status: request.nextUrl.searchParams.get('id_verification_status') ?? 'all',
    has_documents: request.nextUrl.searchParams.get('has_documents') ?? 'any',
  });

  if (!parsedFilters.success) {
    return apiError('Invalid filters', 400);
  }

  const filters = parsedFilters.data;
  const { supabase } = auth;
  let query = supabase
    .from('profiles')
    .select('id,full_name,phone,role,verification_status,id_verification_status,created_at,stripe_requirements_due')
    .order('created_at', { ascending: true });

  if (filters.status !== 'all') {
    query = query.eq('verification_status', filters.status);
  }

  // id_verification_status filter — applied at DB level
  if (filters.id_verification_status !== 'all') {
    query = query.eq('id_verification_status', filters.id_verification_status);
  }

  // Custom date range — takes precedence over preset date_range if both set
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date);
  }
  if (filters.end_date) {
    // Include the entire end_date day by going to end-of-day
    const endOfDay = filters.end_date.length === 10
      ? `${filters.end_date}T23:59:59.999Z`
      : filters.end_date;
    query = query.lte('created_at', endOfDay);
  }

  const { data: profiles, error } = await query;

  if (error) {
    return apiError(error.message, 400);
  }

  const profileIds = (profiles ?? []).map((p) => p.id);
  let addressByProfile: Record<
    string,
    { county: string | null; locality: string | null; eircode: string | null }
  > = {};
  let docsByProfile: Record<
    string,
    Array<{
      id: string;
      document_type: string;
      verification_status: string;
      storage_path?: string;
      signed_url?: string | null;
      download_url?: string | null;
      preview_url?: string | null;
      created_at: string;
    }>
  > = {};

  if (profileIds.length > 0) {
    const [{ data: docs }, { data: addresses }] = await Promise.all([
      supabase
        .from('pro_documents')
        .select('id,profile_id,document_type,verification_status,storage_path,expires_at,rejection_reason,metadata,created_at')
        .in('profile_id', profileIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('addresses')
        .select('profile_id,county,locality,eircode')
        .in('profile_id', profileIds),
    ]);

    docsByProfile = (docs ?? []).reduce((acc, row) => {
      if (!acc[row.profile_id]) acc[row.profile_id] = [];
      acc[row.profile_id].push({
        id: row.id,
        document_type: row.document_type,
        verification_status: row.verification_status,
        storage_path: row.storage_path,
        signed_url: null,
        download_url: null,
        expires_at: row.expires_at ?? null,
        rejection_reason: row.rejection_reason ?? null,
        metadata: row.metadata ?? {},
        created_at: row.created_at,
      });
      return acc;
    }, {} as Record<string, Array<{ id: string; document_type: string; verification_status: string; storage_path?: string; signed_url?: string | null; download_url?: string | null; preview_url?: string | null; expires_at?: string | null; rejection_reason?: string | null; metadata?: Record<string, unknown>; created_at: string }>>);

    const storageClient = getSupabaseServiceClient();
    for (const [profileId, profileDocs] of Object.entries(docsByProfile)) {
      docsByProfile[profileId] = await Promise.all(
        profileDocs.map(async (doc) => {
          if (!doc.storage_path) {
            return { ...doc, signed_url: null, download_url: null, preview_url: null };
          }

          const { data: signed, error: signedError } = await storageClient.storage
            .from('pro-documents')
            .createSignedUrl(doc.storage_path, 60 * 10);

          if (signedError || !signed?.signedUrl) {
            return { ...doc, signed_url: null, download_url: null, preview_url: null };
          }

          const lower = doc.storage_path.toLowerCase();
          const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg');
          const fileName = doc.storage_path.split('/').pop() ?? `${doc.document_type}.pdf`;
          const separator = signed.signedUrl.includes('?') ? '&' : '?';
          const downloadUrl = `${signed.signedUrl}${separator}download=${encodeURIComponent(fileName)}`;

          return {
            ...doc,
            signed_url: signed.signedUrl,
            download_url: downloadUrl,
            preview_url: isImage ? signed.signedUrl : null,
          };
        })
      );
    }

    addressByProfile = (addresses ?? []).reduce((acc, row) => {
      acc[row.profile_id] = {
        county: row.county ?? null,
        locality: row.locality ?? null,
        eircode: row.eircode ?? null,
      };
      return acc;
    }, {} as Record<string, { county: string | null; locality: string | null; eircode: string | null }>);
  }

  let applications = (profiles ?? []).map((profile) => {
    const docs = docsByProfile[profile.id] ?? [];
    const isProviderApplication = profile.stripe_requirements_due?.application_status === 'submitted';
    const hasIdDocument = docs.some((d) => d.document_type === 'id_verification');

    return {
      ...profile,
      documents: docs,
      address: addressByProfile[profile.id] ?? null,
      review_type: isProviderApplication
        ? 'provider_application'
        : hasIdDocument && profile.id_verification_status === 'pending'
        ? 'customer_identity_review'
        : 'other',
    };
  });

  const q = filters.q.toLowerCase();
  const city = filters.city.toLowerCase();
  const county = filters.county.toLowerCase();
  const category = filters.category.toLowerCase();
  const service = filters.service.toLowerCase();

  if (q) {
    applications = applications.filter((item) => {
      const name = item.full_name?.toLowerCase() ?? '';
      const phone = item.phone?.toLowerCase() ?? '';
      const email = String(item.stripe_requirements_due?.personal_info?.email ?? '').toLowerCase();
      const id = item.id.toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q) || id.includes(q);
    });
  }

  if (city) {
    applications = applications.filter((item) =>
      (item.stripe_requirements_due?.personal_info?.primary_city ?? '').toLowerCase().includes(city)
    );
  }

  if (county && county !== 'all') {
    applications = applications.filter((item) =>
      (item.address?.county ?? '').toLowerCase().includes(county)
    );
  }

  if (category && category !== 'all') {
    applications = applications.filter((item) =>
      (item.stripe_requirements_due?.services_and_skills?.services ?? []).some((s: string) =>
        s.toLowerCase().includes(category)
      )
    );
  }

  if (service) {
    applications = applications.filter((item) =>
      (item.stripe_requirements_due?.services_and_skills?.services ?? []).some((s: string) =>
        s.toLowerCase().includes(service)
      )
    );
  }

  if (filters.review_type !== 'all') {
    applications = applications.filter((item) => item.review_type === filters.review_type);
  }

  // Preset date_range only applies when no custom start_date/end_date is set
  if (filters.date_range !== 'all' && !filters.start_date && !filters.end_date) {
    const days = filters.date_range === '7d' ? 7 : filters.date_range === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    applications = applications.filter((item) => new Date(item.created_at) >= cutoff);
  }

  // has_documents filter
  if (filters.has_documents === 'yes') {
    applications = applications.filter((item) => item.documents.length > 0);
  } else if (filters.has_documents === 'no') {
    applications = applications.filter((item) => item.documents.length === 0);
  }

  const { data: auditLogs } = await supabase
    .from('admin_audit_logs')
    .select('id,admin_user_id,admin_email,action,target_type,target_profile_id,target_label,details,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ applications, filters, audit_logs: auditLogs ?? [] });
}

export const GET = withRateLimit(RATE_LIMITS.ADMIN_READ, getHandler);

async function patchHandler(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { supabase } = auth;
  const serviceSupabase = getSupabaseServiceClient();

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = adminProviderDecisionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { profile_id, decision, note } = parsed.data;
  const { data: existing } = await supabase
    .from('profiles')
    .select('stripe_requirements_due,is_verified,verification_status')
    .eq('id', profile_id)
    .maybeSingle();

  const isProviderApplication = existing?.stripe_requirements_due?.application_status === 'submitted';

  if (decision === 'approve') {
    const { data: docs, error: docsError } = await supabase
      .from('pro_documents')
      .select('document_type,verification_status')
      .eq('profile_id', profile_id);

    if (docsError) {
      return apiError(docsError.message, 400);
    }

    const hasVerifiedIdDocument = (docs ?? []).some(
      (doc) => doc.document_type === 'id_verification' && doc.verification_status === 'verified'
    );
    const hasVerifiedIdentity =
      existing?.is_verified === true && existing?.verification_status === 'verified';
    const hasVerifiedId = hasVerifiedIdDocument || hasVerifiedIdentity;
    const hasVerifiedInsurance = (docs ?? []).some(
      (doc) =>
        doc.document_type === 'public_liability_insurance' && doc.verification_status === 'verified'
    );

    if (isProviderApplication) {
      if (!hasVerifiedId || !hasVerifiedInsurance) {
        return apiError(
          'Cannot approve profile yet. ID and insurance documents must both be verified first.',
          400
        );
      }
    } else if (!hasVerifiedId) {
      return apiError(
        'Cannot approve customer identity yet. ID document must be verified first.',
        400
      );
    }
  }

  const patch =
    decision === 'approve'
      ? isProviderApplication
        ? {
            role: 'verified_pro',
            is_verified: true,
            verification_status: 'verified',
            id_verification_status: 'approved',
            id_verification_rejected_reason: null,
            id_verification_reviewed_by: auth.user?.id ?? null,
            id_verification_reviewed_at: new Date().toISOString(),
          }
        : {
            role: 'customer',
            is_verified: true,
            verification_status: 'verified',
            id_verification_status: 'approved',
            id_verification_rejected_reason: null,
            id_verification_reviewed_by: auth.user?.id ?? null,
            id_verification_reviewed_at: new Date().toISOString(),
          }
      : decision === 'request_changes'
      ? {
          role: 'customer',
          is_verified: false,
          verification_status: 'pending',
          id_verification_status: 'rejected',
          id_verification_rejected_reason: note || 'Please re-upload a valid identity document.',
          id_verification_reviewed_by: auth.user?.id ?? null,
          id_verification_reviewed_at: new Date().toISOString(),
        }
      : {
          role: 'customer',
          is_verified: false,
          verification_status: 'rejected',
          id_verification_status: 'rejected',
          id_verification_rejected_reason: note || 'Identity verification was rejected.',
          id_verification_reviewed_by: auth.user?.id ?? null,
          id_verification_reviewed_at: new Date().toISOString(),
        };

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...patch,
      stripe_requirements_due: {
        ...(existing?.stripe_requirements_due ?? {}),
        admin_review: {
          decision,
          note,
          reviewed_by: auth.user?.id ?? null,
          reviewed_by_email: auth.user?.email ?? null,
          reviewed_at: new Date().toISOString(),
        },
      },
    })
    .eq('id', profile_id)
    .select('id,full_name,verification_status,role,is_verified')
    .single();

  if (error) {
    return apiError(error.message, 400);
  }

  if (decision === 'approve' && isProviderApplication) {
    const { error: roleError } = await serviceSupabase
      .from('user_roles')
      .upsert(
        {
          user_id: profile_id,
          role: 'verified_pro',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,role' }
      );

    if (roleError) {
      return apiError(roleError.message, 400);
    }
  } else {
    if (decision !== 'approve') {
      const { data: idDocs } = await serviceSupabase
        .from('pro_documents')
        .select('id,storage_path')
        .eq('profile_id', profile_id)
        .eq('document_type', 'id_verification');

      if ((idDocs ?? []).length > 0) {
        await serviceSupabase
          .from('pro_documents')
          .update({ archived_at: new Date().toISOString() })
          .in(
            'id',
            (idDocs ?? []).map((item) => item.id)
          );
        await serviceSupabase
          .from('profiles')
          .update({ id_verification_document_url: null })
          .eq('id', profile_id);
      }
    }

    const { error: removeError } = await serviceSupabase
      .from('user_roles')
      .delete()
      .eq('user_id', profile_id)
      .eq('role', 'verified_pro');

    if (removeError) {
      return apiError(removeError.message, 400);
    }
  }

  const context = isProviderApplication ? 'provider_application' : 'customer_identity_review';
  const statusLabel =
    decision === 'approve' ? 'approved' : decision === 'request_changes' ? 'changes_requested' : 'rejected';

  const { error: notificationError } = await serviceSupabase.from('notifications').insert({
    user_id: profile_id,
    type: 'admin_verification_update',
    payload: {
      context,
      decision,
      status: statusLabel,
      note,
      profile_id,
      reviewed_at: new Date().toISOString(),
    },
  });

  if (notificationError) {
    return apiError(notificationError.message, 400);
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', profile_id)
    .maybeSingle();

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: decision === 'approve' ? 'application_approved' : decision === 'reject' ? 'application_rejected' : 'changes_requested',
    targetType: context,
    targetProfileId: profile_id,
    targetLabel: targetProfile?.full_name ?? null,
    details: {
      note,
      status: statusLabel,
      reviewed_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({ profile: data });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
