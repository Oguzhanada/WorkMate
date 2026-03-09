'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';

type Props = {
  providerId: string;
  initialSaved: boolean;
};

export default function FavouriteButton({ providerId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/favourites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider_id: providerId }),
        });
        if (res.ok) {
          const json = await res.json() as { saved?: boolean };
          if (typeof json.saved === 'boolean') setSaved(json.saved);
        }
      } catch {
        // best-effort toggle — silent on network failure
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-label={saved ? 'Remove from saved providers' : 'Save provider'}
      title={saved ? 'Remove from saved' : 'Save provider'}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: isPending ? 'not-allowed' : 'pointer',
        padding: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <Heart
        size={18}
        style={{
          fill: saved ? 'var(--wm-destructive)' : 'none',
          stroke: saved ? 'var(--wm-destructive)' : 'var(--wm-muted)',
          transition: 'fill 0.15s, stroke 0.15s',
        }}
      />
    </button>
  );
}
