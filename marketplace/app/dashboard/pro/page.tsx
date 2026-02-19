import ProDashboard from '@/components/dashboard/ProDashboard';

export default function ProDashboardPage() {
  const mockProId = '00000000-0000-0000-0000-000000000002';
  return (
    <main className="mx-auto max-w-4xl p-6">
      <ProDashboard profileId={mockProId} />
    </main>
  );
}
