import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getUserRoles } from '@/lib/auth/rbac';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'View and edit your WorkMate profile.',
};
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { hasAtLeastTwoNameParts } from '@/lib/validation/name';
import { isValidIrishPhone } from '@/lib/ireland/phone';
import ProfileLayout from '@/components/profile/ProfileLayout';
import ProfileTabContent from '@/components/profile/ProfileTabContent';

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ verification?: string; focus?: string; message?: string; tab?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [{ data: profile }, , , { data: address }, { data: docs }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('pro_services').select('id').eq('profile_id', user.id),
      supabase.from('pro_service_areas').select('id').eq('profile_id', user.id),
      supabase
        .from('addresses')
        .select('address_line_1,address_line_2,locality,county,eircode')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('pro_documents').select('document_type,verification_status').eq('profile_id', user.id),
    ]);

  const { count: postedJobsCount } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', user.id);

  const userRoles = await getUserRoles(supabase, user.id);
  const roles = new Set(userRoles);
  const hasProviderRole = roles.has('verified_pro') || roles.has('admin');
  const hasAdminRole = roles.has('admin');
  if (hasAdminRole) redirect(`/${locale}/dashboard/admin`);

  const profileHref = (suffix: string) => `/${locale}/profile${suffix}`;

  const hasIdDocument = (docs ?? []).some((item) => item.document_type === 'id_verification');
  const hasInsuranceDocument = (docs ?? []).some(
    (item) => item.document_type === 'public_liability_insurance'
  );
  const idVerificationStatus = profile?.id_verification_status ?? 'none';
  const insuranceDocStatus = (docs ?? []).find(
    (item) => item.document_type === 'public_liability_insurance'
  )?.verification_status;

  const completionItems = [
    {
      id: 'name',
      title: 'Full name',
      description: 'Use first name + last name in English characters.',
      status: hasAtLeastTwoNameParts(profile?.full_name ?? '') ? 'complete' : 'missing',
      href: profileHref('?focus=name#account-details'),
      formHint: 'Update your legal full name from the account details section.',
      reasonHint: 'Your full legal name helps trust, matching, and verification consistency.',
    },
    {
      id: 'phone',
      title: 'Phone number',
      description: 'Add a valid Irish number for booking updates.',
      status: isValidIrishPhone(profile?.phone ?? '') ? 'complete' : 'missing',
      href: profileHref('?focus=phone#account-details'),
      formHint: 'Add your reachable phone number in account details.',
      reasonHint: 'Phone is used for urgent booking updates and support follow-up.',
    },
    {
      id: 'address',
      title: 'Address',
      description: 'Set your county and Eircode details.',
      status: address?.address_line_1 && address?.county && address?.eircode ? 'complete' : 'missing',
      href: profileHref('?focus=address_line_1#address-information'),
      formHint: 'Complete your address form to improve matching quality.',
      reasonHint: 'County and Eircode improve local matching and service eligibility.',
    },
    {
      id: 'photo',
      title: 'Profile photo',
      description: 'A profile photo improves trust and reply rate.',
      status: profile?.avatar_url ? 'complete' : 'missing',
      href: profileHref('?focus=photo#account-details'),
      formHint: 'Use Choose photo to upload or replace your avatar.',
      reasonHint: 'A profile photo improves credibility and response rate.',
    },
    {
      id: 'id',
      title: 'Identity document',
      description: hasProviderRole
        ? 'Required for identity verification.'
        : 'Verified identity benefits: stronger trust and better matching.',
      status: hasProviderRole
        ? idVerificationStatus === 'approved'
          ? 'complete'
          : idVerificationStatus === 'pending'
          ? 'pending'
          : 'missing'
        : idVerificationStatus === 'approved'
        ? 'complete'
        : idVerificationStatus === 'pending'
        ? 'pending'
        : 'optional',
      href: profileHref('?focus=id#identity-verification'),
      formHint: hasProviderRole
        ? 'Upload your ID document. Admin review will follow.'
        : 'Upload ID anytime to unlock verified identity benefits.',
      reasonHint: hasProviderRole
        ? 'ID verification is required for trust, compliance, and safer transactions.'
        : 'Verified identity can improve provider confidence and match quality.',
    },
  ] as Array<{
    id: string;
    title: string;
    description: string;
    status: 'missing' | 'pending' | 'complete' | 'optional';
    href: string;
    formHint: string;
    reasonHint?: string;
  }>;

  if (hasProviderRole) {
    completionItems.push({
      id: 'proof',
      title: 'Professional proof',
      description: 'Optional documents that increase trust level and matching priority.',
      status:
        insuranceDocStatus === 'verified'
          ? 'complete'
          : insuranceDocStatus === 'pending'
          ? 'pending'
          : 'optional',
      href: profileHref('?focus=proof#identity-verification'),
      formHint: 'Upload optional provider documents to improve trust signals and job matching opportunities.',
      reasonHint: 'More verified documents can improve profile reliability score and visibility in matching.',
    });
  }

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-';

  /* ── Determine initial tab from query params ─────────────────── */
  const initialTab = query.tab ?? (query.focus === 'id' || query.focus === 'proof' ? 'security' : 'profile');

  return (
    <main
      style={{
        background: 'var(--wm-bg)',
        minHeight: '100vh',
        paddingTop: 32,
        paddingBottom: 64,
        fontFamily: 'var(--wm-font-sans)',
        color: 'var(--wm-text)',
      }}
    >
      {/* ── Identity-required banner ─────────────────────────────── */}
      {query.message === 'identity_required' ? (
        <div className="mx-auto mb-6" style={{ maxWidth: 1200, padding: '0 16px' }}>
          <div
            className="rounded-2xl px-5 py-4"
            style={{
              border: '1px solid var(--wm-amber)',
              background: 'var(--wm-amber-light)',
              color: 'var(--wm-amber-dark)',
              boxShadow: 'var(--wm-shadow-sm)',
            }}
          >
            <strong className="block mb-1">Identity verification required before continuing.</strong>
            <p className="m-0 text-sm">
              You were redirected because this action requires an approved identity check.
              Upload your ID below and wait for admin review.
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mx-auto mb-8" style={{ maxWidth: 1200, padding: '0 16px' }}>
        <div
          className="relative overflow-hidden rounded-2xl px-8 py-8"
          style={{
            background: `linear-gradient(135deg, var(--wm-navy) 0%, rgba(var(--wm-navy-rgb), 0.85) 55%, var(--wm-primary-dark) 100%)`,
            boxShadow: 'var(--wm-shadow-xl), 0 0 0 1px rgba(var(--wm-primary-rgb), 0.15)',
          }}
        >
          {/* Radial glow decorations */}
          <div
            className="pointer-events-none absolute"
            style={{
              right: -80,
              top: -80,
              width: 340,
              height: 340,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(var(--wm-primary-rgb), 0.28) 0%, transparent 68%)',
            }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              left: -50,
              bottom: -70,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
            }}
          />
          <h1
            className="relative m-0 text-3xl font-extrabold"
            style={{
              fontFamily: 'var(--wm-font-display)',
              color: '#fff',
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
            }}
          >
            My Profile
          </h1>
          <p className="relative mt-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.62)' }}>
            Manage your account, verification, and settings in one place.
          </p>
        </div>
      </div>

      {/* ── Profile layout with tabs ─────────────────────────────── */}
      <ProfileLayout
        avatarUrl={profile?.avatar_url ?? ''}
        fullName={profile?.full_name ?? 'User'}
        email={user.email ?? '-'}
        isVerified={profile?.verification_status === 'verified'}
        hasProviderRole={hasProviderRole}
        joinedDate={joinedDate}
        jobsPosted={postedJobsCount ?? 0}
        userId={user.id}
        initialTab={initialTab}
      >
        {(activeTab: string) => (
          <ProfileTabContent
            activeTab={activeTab}
            locale={locale}
            userId={user.id}
            userEmail={user.email ?? '-'}
            hasProviderRole={hasProviderRole}
            hasIdDocument={hasIdDocument}
            hasInsuranceDocument={hasInsuranceDocument}
            profile={profile}
            address={address}
            completionItems={completionItems}
            query={query}
          />
        )}
      </ProfileLayout>
    </main>
  );
}
