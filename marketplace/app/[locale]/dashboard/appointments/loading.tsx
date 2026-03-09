import Shell from '@/components/ui/Shell';
import Skeleton from '@/components/ui/Skeleton';

export default function AppointmentsLoading() {
  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <Skeleton lines={1} height="h-14" />
        <Skeleton lines={6} height="h-10" />
      </div>
    </Shell>
  );
}
