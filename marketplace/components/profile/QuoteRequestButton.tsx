'use client';

import { MessageSquareQuote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  providerId: string;
  locale: string;
};

export default function QuoteRequestButton({ providerId, locale }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: { user: unknown } | null } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);

  const handleClick = async () => {
    if (checking) return;
    setChecking(true);

    if (isLoggedIn === null) {
      // Session not resolved yet — re-check
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push(`/${locale}/login?next=/${locale}/post-job?provider_id=${providerId}`);
        return;
      }
    }

    if (!isLoggedIn) {
      router.push(`/${locale}/login?next=/${locale}/post-job?provider_id=${providerId}`);
      return;
    }

    router.push(`/${locale}/post-job?provider_id=${providerId}`);
  };

  return (
    <button
      onClick={handleClick}
      disabled={checking}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold no-underline transition hover:brightness-110 disabled:brightness-90"
      style={{
        background: 'var(--wm-grad-primary)',
        color: '#fff',
        boxShadow: 'var(--wm-shadow-md)',
        border: 'none',
        cursor: checking ? 'default' : 'pointer',
      }}
    >
      <MessageSquareQuote className="h-4 w-4" />
      Request a Quote
    </button>
  );
}
