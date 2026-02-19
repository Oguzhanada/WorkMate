import JobMultiStepForm from '@/components/forms/JobMultiStepForm';

export default function PostJobPage() {
  const mockCustomerId = '00000000-0000-0000-0000-000000000001';
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">İş Talebi Oluştur</h1>
      <JobMultiStepForm customerId={mockCustomerId} />
    </main>
  );
}
