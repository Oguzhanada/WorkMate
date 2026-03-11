import Skeleton from '@/components/ui/Skeleton';

export default function BlogArticleLoading() {
  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <Skeleton className="h-5 w-24 rounded-lg" />
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </main>
  );
}
