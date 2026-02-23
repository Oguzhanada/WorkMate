import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { adminProviderDecisionSchema, adminProviderFiltersSchema } from '@/lib/validation/api';

export async function GET(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const parsedFilters = adminProviderFiltersSchema.safeParse({
    status: request.nextUrl.searchParams.get('status') ?? 'pending',
    city: request.nextUrl.searchParams.get('city') ?? '',
    service: request.nextUrl.searchParams.get('service') ?? '',
    q: request.nextUrl.searchParams.get('q') ?? '',
  });

  if (!parsedFilters.success) {
    return NextResponse.json({ error: 'Invalid filters' }, { status: 400 });
  }

  const filters = parsedFilters.data;
  const { supabase } = auth;
  let query = supabase
    .from('profiles')
    .select('id,full_name,phone,role,verification_status,created_at,stripe_requirements_due')
    .order('created_at', { ascending: true });

  if (filters.status !== 'all') {
    query = query.eq('verification_status', filters.status);
  }

  const { data: profiles, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const profileIds = (profiles ?? []).map((p) => p.id);
  let docsByProfile: Record<string, Array<{ document_type: string; created_at: string }>> = {};

  if (profileIds.length > 0) {
    const { data: docs } = await supabase
      .from('pro_documents')
      .select('profile_id,document_type,created_at')
      .in('profile_id', profileIds)
      .order('created_at', { ascending: false });

    docsByProfile = (docs ?? []).reduce((acc, row) => {
      if (!acc[row.profile_id]) acc[row.profile_id] = [];
      acc[row.profile_id].push({
        document_type: row.document_type,
        created_at: row.created_at,
      });
      return acc;
    }, {} as Record<string, Array<{ document_type: string; created_at: string }>>);
  }

  let applications = (profiles ?? []).map((profile) => ({
    ...profile,
    documents: docsByProfile[profile.id] ?? [],
  }));

  const q = filters.q.toLowerCase();
  const city = filters.city.toLowerCase();
  const service = filters.service.toLowerCase();

  if (q) {
    applications = applications.filter((item) => {
      const name = item.full_name?.toLowerCase() ?? '';
      const phone = item.phone?.toLowerCase() ?? '';
      return name.includes(q) || phone.includes(q);
    });
  }

  if (city) {
    applications = applications.filter((item) =>
      (item.stripe_requirements_due?.personal_info?.primary_city ?? '').toLowerCase().includes(city)
    );
  }

  if (service) {
    applications = applications.filter((item) =>
      (item.stripe_requirements_due?.services_and_skills?.services ?? []).some((s: string) =>
        s.toLowerCase().includes(service)
      )
    );
  }

  return NextResponse.json({ applications, filters });
}

export async function PATCH(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { supabase } = auth;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = adminProviderDecisionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { profile_id, decision, note } = parsed.data;
  const { data: existing } = await supabase
    .from('profiles')
    .select('stripe_requirements_due')
    .eq('id', profile_id)
    .maybeSingle();

  const patch =
    decision === 'approve'
      ? { role: 'verified_pro', is_verified: true, verification_status: 'verified' }
      : { is_verified: false, verification_status: 'rejected' };

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...patch,
      stripe_requirements_due: {
        ...(existing?.stripe_requirements_due ?? {}),
        admin_review: {
          decision,
          note,
          reviewed_at: new Date().toISOString(),
        },
      },
    })
    .eq('id', profile_id)
    .select('id,full_name,verification_status,role,is_verified')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}
