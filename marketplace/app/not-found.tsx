import { FileQuestion } from 'lucide-react';
import Shell from '@/components/ui/Shell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function RootNotFound() {
  return (
    <Shell>
      <Card className="mx-auto max-w-md text-center">
        <div className="flex justify-center text-zinc-400 dark:text-zinc-500">
          <FileQuestion size={48} />
        </div>
        <p className="mt-4 text-4xl font-bold text-zinc-800 dark:text-zinc-100">404</p>
        <p className="mt-2 text-lg font-semibold text-zinc-700 dark:text-zinc-300">Page not found</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" href="/">
            Go home
          </Button>
        </div>
      </Card>
    </Shell>
  );
}
