'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

type Notification = {
  id: string;
  type: string;
  created_at: string;
};

type Props = {
  limit?: number;
};

export default function RecentMessagesWidget({ limit = 6 }: Props) {
  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        setError('Not authenticated.');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('id,type,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setRows(data ?? []);
      }
      setLoading(false);
    };

    void load();
  }, [limit]);

  return (
    <div>
      <p className="text-sm font-semibold">Recent Messages</p>
      {loading ? (
        <div className="mt-3">
          <Skeleton lines={3} height="h-10" />
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} />}
          title="No recent notifications"
          description="New activity and messages will appear here."
        />
      ) : null}
      <div className="mt-2 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
            <p className="font-medium">{row.type.replaceAll('_', ' ')}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(row.created_at).toLocaleString('en-IE')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
