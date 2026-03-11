import Link from 'next/link';
import {Crown} from 'lucide-react';
import {getSupabaseServiceClient} from '@/lib/supabase/service';

export default async function FoundingProBanner({locale = 'en'}: {locale?: string}) {
  const supabase = getSupabaseServiceClient();

  const {data: config} = await supabase
    .from('founding_pro_config')
    .select('max_slots,current_count,program_active')
    .limit(1)
    .single();

  if (!config?.program_active) return null;

  const remaining = config.max_slots - config.current_count;
  if (remaining <= 0) return null;

  return (
    <section
      style={{
        background: 'var(--wm-grad-warm)',
        borderBottom: '1px solid var(--wm-border-soft)',
        padding: '14px 24px',
        textAlign: 'center',
      }}
    >
      <Link
        href={`/${locale}/founding-pro`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--wm-navy)',
          textDecoration: 'none',
          fontFamily: 'var(--wm-font-display)',
          fontWeight: 700,
          fontSize: '0.95rem',
        }}
      >
        <Crown size={18} style={{color: 'var(--wm-amber-dark)'}} />
        <span>
          Founding Pro Programme —{' '}
          <strong style={{color: 'var(--wm-primary-dark)'}}>
            {remaining} of {config.max_slots} spots remaining
          </strong>
        </span>
        <span
          style={{
            background: 'var(--wm-primary)',
            color: '#fff',
            borderRadius: 'var(--wm-radius-full)',
            padding: '4px 12px',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginLeft: 4,
          }}
        >
          Join Now
        </span>
      </Link>
    </section>
  );
}
