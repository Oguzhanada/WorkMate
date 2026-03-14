'use client';

import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, ClipboardList } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Stats = {
  total: number;
  open: number;
  completed: number;
};

export default function CustomerStatsWidget() {
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from('jobs')
        .select('status')
        .eq('customer_id', user.user.id);

      if (data) {
        setStats({
          total: data.length,
          open: data.filter((j: { status: string }) => j.status === 'open').length,
          completed: data.filter((j: { status: string }) => j.status === 'completed').length,
        });
      }
      setLoading(false);
    };
    void load();
  }, []);

  const display = (n: number) => (loading ? '—' : n);

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        label="Total Jobs"
        value={display(stats.total)}
        icon={<Briefcase className="h-4 w-4" />}
      />
      <StatCard
        label="Open"
        value={display(stats.open)}
        icon={<ClipboardList className="h-4 w-4" />}
      />
      <StatCard
        label="Completed"
        value={display(stats.completed)}
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
    </div>
  );
}
