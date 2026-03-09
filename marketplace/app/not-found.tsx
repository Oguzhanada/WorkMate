import { FileQuestion } from 'lucide-react';
import Shell from '@/components/ui/Shell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function RootNotFound() {
  return (
    <Shell>
      <Card className="mx-auto max-w-md text-center">
        <div className="flex justify-center" style={{ color: 'var(--wm-primary-light)' }}>
          <FileQuestion size={48} style={{ color: 'var(--wm-primary)' }} />
        </div>
        <p className="mt-4 text-4xl font-bold" style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}>404</p>
        <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--wm-text)' }}>Page not found</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
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
