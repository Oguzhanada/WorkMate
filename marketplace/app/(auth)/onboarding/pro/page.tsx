import ProOnboardingForm from '@/components/forms/ProOnboardingForm';

export default function ProOnboardingPage() {
  const mockProId = '00000000-0000-0000-0000-000000000002';
  return (
    <main className="mx-auto max-w-xl p-6">
      <ProOnboardingForm profileId={mockProId} />
    </main>
  );
}
