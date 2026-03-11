'use client';

import { useState } from 'react';
import ProfileLayout from './ProfileLayout';
import ProfileTabContent from './ProfileTabContent';

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
  /* Layout / sidebar */
  avatarUrl: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  hasProviderRole: boolean;
  joinedDate: string;
  jobsPosted: number;
  userId: string;
  initialTab: string;
  /* Tab content */
  locale: string;
  userEmail: string;
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

export default function ProfilePageShell({
  avatarUrl,
  fullName,
  email,
  isVerified,
  hasProviderRole,
  joinedDate,
  jobsPosted,
  userId,
  initialTab,
  locale,
  userEmail,
  hasIdDocument,
  hasInsuranceDocument,
  profile,
  address,
  completionItems,
  query,
}: Props) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <ProfileLayout
      avatarUrl={avatarUrl}
      fullName={fullName}
      email={email}
      isVerified={isVerified}
      hasProviderRole={hasProviderRole}
      joinedDate={joinedDate}
      jobsPosted={jobsPosted}
      userId={userId}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <ProfileTabContent
        activeTab={activeTab}
        locale={locale}
        userId={userId}
        userEmail={userEmail}
        hasProviderRole={hasProviderRole}
        hasIdDocument={hasIdDocument}
        hasInsuranceDocument={hasInsuranceDocument}
        profile={profile}
        address={address}
        completionItems={completionItems}
        query={query}
      />
    </ProfileLayout>
  );
}
