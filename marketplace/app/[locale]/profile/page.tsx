import {redirect} from 'next/navigation';

import {getUserRoles} from '@/lib/auth/rbac';
import {getSupabaseServerClient} from '@/lib/supabase/server';
import {hasAtLeastTwoNameParts} from '@/lib/validation/name';
import {isValidIrishPhone} from '@/lib/validation/phone';
import ProfileAddressForm from '@/components/forms/ProfileAddressForm';
import ProPortfolioPanel from '@/components/profile/ProPortfolioPanel';
import ProfileVerificationPanel from '@/components/profile/ProfileVerificationPanel';
import ProfileAvatarPanel from '@/components/profile/ProfileAvatarPanel';
import ProfileBasicInfoPanel from '@/components/profile/ProfileBasicInfoPanel';
import ProfileCompletionCard from '@/components/profile/ProfileCompletionCard';
import ApiKeyCard from '@/components/profile/ApiKeyCard';
import ProviderAvailability from '@/components/profile/ProviderAvailability';
import ProfileExpressionCard from '@/components/profile/ProfileExpressionCard';

import pageStyles from './profile-page.module.css';

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{verification?: string; focus?: string; message?: string}>;
}) {
  const {locale} = await params;
  const query = await searchParams;

  const supabase = await getSupabaseServerClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [{data: profile}, {data: proServices}, {data: proAreas}, {data: address}, {data: docs}] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('pro_services').select('id').eq('profile_id', user.id),
      supabase.from('pro_service_areas').select('id').eq('profile_id', user.id),
      supabase
        .from('addresses')
        .select('address_line_1,address_line_2,locality,county,eircode')
        .eq('profile_id', user.id)
        .order('created_at', {ascending: false})
        .limit(1)
        .maybeSingle(),
      supabase.from('pro_documents').select('document_type,verification_status').eq('profile_id', user.id),
    ]);

  const {count: postedJobsCount} = await supabase
    .from('jobs')
    .select('id', {count: 'exact', head: true})
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

  const initials =
    (profile?.full_name ?? 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';
  const statusOk = profile?.verification_status === 'verified';

  return (
    <main className={pageStyles.page}>
      <div className={pageStyles.container}>
        {query.message === 'identity_required' ? (
          <section className={pageStyles.identityBanner}>
            <strong>Identity verification required before continuing.</strong>
            <p>
              You were redirected because this action requires an approved identity check.
              Upload your ID below and wait for admin review.
            </p>
          </section>
        ) : null}

        <section className={pageStyles.hero}>
          <div>
            <h1 className={pageStyles.heroTitle}>My Profile</h1>
            <p className={pageStyles.heroSub}>Keep your account and verification details up to date.</p>
          </div>
          <div className={pageStyles.heroIdentity}>
            <ProfileAvatarPanel
              compact
              initialAvatarUrl={profile?.avatar_url ?? ''}
              initialFullName={profile?.full_name ?? initials}
              autoOpenPicker={query.focus === 'photo'}
            />
            <div>
              <p>{profile?.full_name ?? '-'}</p>
              <p className={pageStyles.heroSub}>{user.email ?? '-'}</p>
              <span className={`${pageStyles.badge} ${statusOk ? pageStyles.verified : pageStyles.notVerified}`}>
                {statusOk ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>
        </section>

        <section className={pageStyles.grid}>
          <div className={pageStyles.col}>
            <div id="account-details" className={pageStyles.card}>
              <ProfileBasicInfoPanel
                initialFullName={profile?.full_name ?? ''}
                initialPhone={profile?.phone ?? ''}
                email={user.email ?? '-'}
                statusLabel={profile?.verification_status ?? 'unverified'}
                initialEditField={query.focus === 'name' || query.focus === 'phone' ? query.focus : null}
              />
            </div>
            <div className={pageStyles.card}>
              <ProfileCompletionCard items={completionItems} showProviderCta={!hasProviderRole} />
            </div>
          </div>

          <div className={pageStyles.col}>
            <div className={pageStyles.card}>
              <ProfileVerificationPanel
                profileId={user.id}
                hasIdDocument={hasIdDocument}
                hasInsuranceDocument={hasInsuranceDocument}
                hasProviderRole={hasProviderRole}
                verificationStatus={profile?.verification_status ?? ''}
                idVerificationStatus={profile?.id_verification_status ?? 'none'}
                rejectedReason={profile?.id_verification_rejected_reason ?? ''}
                showRedirectHint={query.verification === 'required' || query.message === 'identity_required'}
                autoFocusTarget={query.focus === 'id' || query.focus === 'proof' ? query.focus : null}
                stripeIdentityStatus={profile?.stripe_identity_status ?? 'not_started'}
                idVerificationMethod={profile?.id_verification_method ?? 'document_upload'}
              />
            </div>
            <div id="address-information" className={pageStyles.card}>
              <ProfileAddressForm
                initialAddress={address}
                autoFocusField={
                  query.focus === 'address_line_1' ||
                  query.focus === 'locality' ||
                  query.focus === 'county' ||
                  query.focus === 'eircode'
                    ? query.focus
                    : null
                }
              />
            </div>
          </div>
        </section>

        <section className={pageStyles.summary}>
          <h3>Account Summary</h3>
          <div className={pageStyles.summaryGrid}>
            <div className={pageStyles.summaryItem}>
              <p>Joined</p>
              <strong>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}</strong>
            </div>
            <div className={pageStyles.summaryItem}>
              <p>Last login</p>
              <strong>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '-'}</strong>
            </div>
            <div className={pageStyles.summaryItem}>
              <p>Tasks posted</p>
              <strong>{postedJobsCount ?? 0}</strong>
            </div>
          </div>
        </section>

        <ProfileExpressionCard />

        <ApiKeyCard initialApiKey={profile?.api_key ?? null} initialRateLimit={profile?.api_rate_limit ?? 1000} />

        {/* ── Privacy & GDPR Settings link ──────────────────────────────── */}
        <div
          className="rounded-[22px] border p-5"
          style={{
            background: 'var(--color-background-secondary)',
            borderColor: 'var(--wm-border)',
            boxShadow: 'var(--wm-shadow-sm)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                className="text-sm font-bold"
                style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
              >
                Privacy &amp; Account Settings
              </p>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--wm-muted)' }}>
                Export your data or request account deletion under GDPR.
              </p>
            </div>
            <a
              href={`/${locale}/account/settings`}
              className="inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold"
              style={{
                borderColor: 'var(--wm-border)',
                background: 'var(--wm-surface)',
                color: 'var(--wm-text)',
                textDecoration: 'none',
              }}
            >
              Manage
            </a>
          </div>
        </div>

        {hasProviderRole ? <ProviderAvailability providerId={user.id} /> : null}

        {hasProviderRole ? <ProPortfolioPanel /> : null}
      </div>
    </main>
  );
}
