import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Your WorkMate conversations.',
};
import Shell from '@/components/ui/Shell';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { MessageSquare } from 'lucide-react';

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: messages } = await supabase
    .from('job_messages')
    .select('id,job_id,quote_id,sender_id,receiver_id,message,created_at')
    .eq('visibility', 'private')
    .order('created_at', { ascending: false })
    .limit(100);

  const items = messages ?? [];
  const groupedByThread = new Map<string, typeof items>();
  for (const item of items) {
    const threadKey = `${item.job_id}:${item.quote_id ?? 'no-quote'}`;
    const existing = groupedByThread.get(threadKey) ?? [];
    existing.push(item);
    groupedByThread.set(threadKey, existing);
  }

  const conversationCards = Array.from(groupedByThread.entries())
    .map(([threadKey, threadMessages]) => ({
      threadKey,
      latest: threadMessages[0],
      count: threadMessages.length,
      recentCount: threadMessages.filter(
        (item) => Date.now() - new Date(item.created_at).getTime() <= 24 * 60 * 60 * 1000
      ).length,
    }))
    .sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime());

  const totalRecent = conversationCards.reduce((sum, entry) => sum + entry.recentCount, 0);

  return (
    <Shell
      header={
        <PageHeader
          title="Private Messages"
          description="Track quote discussions, recent activity, and follow-ups in one place."
        />
      }
    >
      <Card className="mt-4 rounded-3xl">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--wm-subtle)' }}>
              Conversations
            </p>
            <p className="text-2xl font-bold">{conversationCards.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--wm-subtle)' }}>
              Messages (24h)
            </p>
            <p className="text-2xl font-bold">{totalRecent}</p>
          </div>
          <div className="flex items-center sm:justify-end">
            <Button href={`/${locale}/jobs`} variant="secondary" size="sm">
              Browse active jobs
            </Button>
          </div>
        </div>
      </Card>

      {conversationCards.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            icon={<MessageSquare size={32} />}
            title="No private messages yet"
            description="Messages from quote threads will appear here."
          />
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {conversationCards.map((entry) => (
            <Card key={entry.threadKey}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>
                  Job: {entry.latest.job_id.slice(0, 8)}…
                </p>
                {entry.recentCount > 0 ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: 'var(--wm-primary-light)', color: 'var(--wm-primary-dark)' }}
                  >
                    {entry.recentCount} new
                  </span>
                ) : null}
              </div>
              {entry.latest.quote_id ? (
                <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>
                  Quote: {entry.latest.quote_id.slice(0, 8)}…
                </p>
              ) : null}
              <p className="mt-2 line-clamp-3 text-sm">{entry.latest.message}</p>
              <p className="mt-2 text-xs font-medium" style={{ color: 'var(--wm-primary-dark)' }}>
                {entry.count} message{entry.count > 1 ? 's' : ''} in this thread
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--wm-subtle)' }}>
                Last activity: {new Date(entry.latest.created_at).toLocaleString('en-IE')}
              </p>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
