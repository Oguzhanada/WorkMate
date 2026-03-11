import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Latest news, tips, and updates from WorkMate Ireland.',
};

type BlogItem = {
  slug: string;
  title: string;
  summary: string;
  tag: 'Tips' | 'Product' | 'Security' | 'Payments';
  publishedAt: string;
};

const POSTS: BlogItem[] = [
  {
    slug: 'faster-task-posts',
    title: 'How to write a task post that gets better offers',
    summary: 'Use scope, urgency, and budget clarity to improve response quality from providers.',
    tag: 'Tips',
    publishedAt: '2026-03-06',
  },
  {
    slug: 'secure-payments-explained',
    title: 'Secure payment flow explained for customers and providers',
    summary: 'A simple guide to platform payment states, release timing, and dispute-safe evidence.',
    tag: 'Payments',
    publishedAt: '2026-03-04',
  },
  {
    slug: 'verification-roadmap',
    title: 'What verification status means in WorkMate',
    summary: 'Understand pending, approved, and rejected document states with next-step recommendations.',
    tag: 'Security',
    publishedAt: '2026-03-01',
  },
  {
    slug: 'provider-dashboard-updates',
    title: 'Provider dashboard updates and task alert improvements',
    summary: 'Recent UI and matching updates to help providers discover relevant jobs faster.',
    tag: 'Product',
    publishedAt: '2026-02-28',
  },
];

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="rounded-3xl">
          <h1>Insights and updates</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
            Product updates, practical tips, and best practices for successful task delivery.
          </p>
          <div className="mt-4">
            <Button href={`/${locale}/contact`} variant="secondary" size="sm">
              Suggest a topic
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <Card key={post.slug} className="rounded-2xl">
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--wm-subtle)' }}>
                {post.tag}
              </p>
              <h2 className="mt-2 text-lg font-bold">{post.title}</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
                {post.summary}
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--wm-subtle)' }}>
                {new Date(post.publishedAt).toLocaleDateString('en-IE')}
              </p>
              <div className="mt-3">
                <Link
                  href={`/${locale}/blog/${post.slug}`}
                  className="text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: 'var(--wm-primary)' }}
                >
                  Read article →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
