'use client';

import ProfileAddressForm from '@/components/forms/ProfileAddressForm';
import ProPortfolioPanel from '@/components/profile/ProPortfolioPanel';
import ProfileVerificationPanel from '@/components/profile/ProfileVerificationPanel';
import ProfileAvatarPanel from '@/components/profile/ProfileAvatarPanel';
import ProfileBasicInfoPanel from '@/components/profile/ProfileBasicInfoPanel';
import ProfileCompletionCard from '@/components/profile/ProfileCompletionCard';
import ApiKeyCard from '@/components/profile/ApiKeyCard';
import ProviderAvailability from '@/components/profile/ProviderAvailability';
import ProfileExpressionCard from '@/components/profile/ProfileExpressionCard';
import ProfileSection from '@/components/profile/ProfileSection';
import Link from 'next/link';

type CompletionItem = {
  id: string;
  title: string;
  description: string;
  status: 'missing' | 'pending' | 'complete' | 'optional';
  href: string;
  formHint: string;
  reasonHint?: string;
};

type Props = {
  activeTab: string;
  locale: string;
  userId: string;
  userEmail: string;
  hasProviderRole: boolean;
  hasIdDocument: boolean;
  hasInsuranceDocument: boolean;
  profile: Record<string, unknown> | null;
  address: {
    address_line_1: string;
    address_line_2?: string | null;
    locality: string;
    county: string;
    eircode: string;
  } | null;
  completionItems: CompletionItem[];
  query: {
    verification?: string;
    focus?: string;
    message?: string;
  };
};

export default function ProfileTabContent({
  activeTab,
  locale,
  userId,
  userEmail,
  hasProviderRole,
  hasIdDocument,
  hasInsuranceDocument,
  profile,
  address,
  completionItems,
  query,
}: Props) {
  const initials =
    ((profile?.full_name as string) ?? 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';

  /* ── Profile Tab ───────────────────────────────────────────── */
  if (activeTab === 'profile') {
    return (
      <div className="grid gap-5">
        {/* Avatar + photo upload */}
        <ProfileSection
          id="account-details"
          title="Profile Photo"
          subtitle="Upload a photo to build trust with other users."
        >
          <ProfileAvatarPanel
            initialAvatarUrl={(profile?.avatar_url as string) ?? ''}
            initialFullName={(profile?.full_name as string) ?? initials}
            autoOpenPicker={query.focus === 'photo'}
            embedded
          />
        </ProfileSection>

        {/* Basic info — already has its own card, but we embed it inside ProfileSection for consistency */}
        <ProfileSection
          title="Account Details"
          subtitle="Your name, contact, and verification status."
        >
          <ProfileBasicInfoPanel
            initialFullName={(profile?.full_name as string) ?? ''}
            initialPhone={(profile?.phone as string) ?? ''}
            email={userEmail}
            statusLabel={(profile?.verification_status as string) ?? 'unverified'}
            initialEditField={query.focus === 'name' || query.focus === 'phone' ? (query.focus as 'name' | 'phone') : null}
            embedded
          />
        </ProfileSection>

        {/* Profile Completion — already a standalone card component */}
        <ProfileCompletionCard items={completionItems} showProviderCta={!hasProviderRole} />

        {/* About you / expression card — already a Card component */}
        <ProfileExpressionCard />
      </div>
    );
  }

  /* ── Business Tab (Provider only) ──────────────────────────── */
  if (activeTab === 'business') {
    return (
      <div className="grid gap-5">
        {/* Availability — already a Card component */}
        <ProviderAvailability providerId={userId} />

        {/* Portfolio — already has its own card styling */}
        <ProPortfolioPanel />

        {/* API Key — already a Card component */}
        <ApiKeyCard
          initialApiKey={(profile?.api_key as string) ?? null}
          initialRateLimit={(profile?.api_rate_limit as number) ?? 1000}
        />

        {/* Public profile link */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5"
          style={{
            background: 'linear-gradient(145deg, var(--wm-primary-light) 0%, rgba(var(--wm-primary-rgb), 0.04) 100%)',
            border: '1px solid rgba(var(--wm-primary-rgb), 0.2)',
            boxShadow: 'var(--wm-shadow-sm)',
          }}
        >
          <div>
            <p
              className="text-sm font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              Public Profile Preview
            </p>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--wm-muted)' }}>
              See how customers view your profile.
            </p>
          </div>
          <Link
            href={`/${locale}/profile/public/${userId}`}
            className="inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold no-underline"
            style={{
              background: 'linear-gradient(135deg, var(--wm-primary) 0%, var(--wm-primary-dark) 100%)',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(var(--wm-primary-rgb), 0.38)',
            }}
          >
            View Public Profile
          </Link>
        </div>
      </div>
    );
  }

  /* ── Settings Tab ──────────────────────────────────────────── */
  if (activeTab === 'settings') {
    return (
      <div className="grid gap-5">
        {/* Address — has its own card from profile-address.module.css */}
        <div id="address-information">
          <ProfileAddressForm
            initialAddress={address}
            autoFocusField={
              query.focus === 'address_line_1' ||
              query.focus === 'locality' ||
              query.focus === 'county' ||
              query.focus === 'eircode'
                ? (query.focus as 'address_line_1' | 'locality' | 'county' | 'eircode')
                : null
            }
          />
        </div>

        {/* Privacy & GDPR link */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5"
          style={{
            background: 'var(--wm-surface)',
            border: '1px solid var(--wm-border)',
            boxShadow: 'var(--wm-shadow-sm)',
          }}
        >
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
          <Link
            href={`/${locale}/account/settings`}
            className="inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold no-underline"
            style={{
              borderColor: 'var(--wm-border)',
              background: 'var(--wm-surface)',
              color: 'var(--wm-text)',
            }}
          >
            Manage
          </Link>
        </div>
      </div>
    );
  }

  /* ── Security Tab ──────────────────────────────────────────── */
  if (activeTab === 'security') {
    return (
      <div className="grid gap-5">
        {/* Identity verification — has its own panel styling */}
        <ProfileVerificationPanel
          profileId={userId}
          hasIdDocument={hasIdDocument}
          hasInsuranceDocument={hasInsuranceDocument}
          hasProviderRole={hasProviderRole}
          verificationStatus={(profile?.verification_status as string) ?? ''}
          idVerificationStatus={(profile?.id_verification_status as string) ?? 'none'}
          rejectedReason={(profile?.id_verification_rejected_reason as string) ?? ''}
          showRedirectHint={query.verification === 'required' || query.message === 'identity_required'}
          autoFocusTarget={query.focus === 'id' || query.focus === 'proof' ? (query.focus as 'id' | 'proof') : null}
          stripeIdentityStatus={(profile?.stripe_identity_status as string) ?? 'not_started'}
          idVerificationMethod={(profile?.id_verification_method as string) ?? 'document_upload'}
        />
      </div>
    );
  }

  return null;
}
