import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <main className="py-14">
      <div style={{ width: 'min(860px, calc(100% - 32px))', margin: '0 auto' }}>
        <Skeleton lines={3} />
        <div className="mt-6 flex flex-col gap-5">
          <Skeleton lines={6} />
          <Skeleton lines={5} />
          <Skeleton lines={8} />
        </div>
      </div>
    </main>
  );
}
