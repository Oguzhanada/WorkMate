import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
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

  return (
    <Shell header={<PageHeader title="Private Messages" description="Private conversations started from quote threads." />}>

      {items.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            icon={<MessageSquare size={32} />}
            title="No private messages yet"
            description="Messages from quote threads will appear here."
          />
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Job: {item.job_id.slice(0, 8)}…
              </p>
              {item.quote_id ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Quote: {item.quote_id.slice(0, 8)}…
                </p>
              ) : null}
              <p className="mt-2 text-sm">{item.message}</p>
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                {new Date(item.created_at).toLocaleString('en-IE')}
              </p>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
