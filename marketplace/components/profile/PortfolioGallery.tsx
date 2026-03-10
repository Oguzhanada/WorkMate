'use client';

import { useEffect, useRef, useState } from 'react';
import EmptyState from '@/components/ui/EmptyState';

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  display_order: number;
};

type Props = {
  providerId: string;
};

export default function PortfolioGallery({ providerId }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/providers/${providerId}/portfolio`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [providerId]);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxItem) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [lightboxItem]);

  // Trap focus / prevent scroll when lightbox is open
  useEffect(() => {
    if (lightboxItem) {
      document.body.style.overflow = 'hidden';
      dialogRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxItem]);

  if (loading) {
    return (
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        aria-busy="true"
        aria-label="Loading portfolio"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl"
            style={{ background: 'var(--wm-surface)' }}
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No portfolio items yet"
        description="This provider hasn't added any work photos yet."
      />
    );
  }

  return (
    <>
      {/* ── Gallery Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxItem(item)}
            className="group relative aspect-square overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2"
            style={{
              border: '1px solid var(--wm-border)',
              background: 'var(--wm-surface)',
              cursor: 'pointer',
            }}
            aria-label={`View ${item.title}`}
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {/* Title overlay on hover */}
            <div
              className="absolute inset-x-0 bottom-0 translate-y-full px-3 py-2 transition-transform duration-200 group-hover:translate-y-0 group-focus-visible:translate-y-0"
              style={{ background: 'rgba(15,23,42,0.82)' }}
            >
              <p
                className="truncate text-xs font-semibold"
                style={{ color: 'var(--wm-text-on-dark, #f8fafc)' }}
              >
                {item.title}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Lightbox Modal ────────────────────────────────────────────── */}
      {lightboxItem ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title}
          ref={dialogRef}
          tabIndex={-1}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxItem(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)',
            padding: '1rem',
          }}
        >
          <div
            className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl"
            style={{
              background: 'var(--wm-bg)',
              border: '1px solid var(--wm-border)',
              boxShadow: 'var(--wm-shadow-2xl)',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setLightboxItem(null)}
              aria-label="Close image preview"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-opacity hover:opacity-80"
              style={{
                background: 'rgba(15,23,42,0.7)',
                color: 'var(--wm-bg)',
              }}
            >
              ✕
            </button>

            {/* Image */}
            <div className="relative max-h-[70vh] overflow-hidden">
              <img
                src={lightboxItem.image_url}
                alt={lightboxItem.title}
                className="h-full w-full object-contain"
                style={{ maxHeight: '70vh' }}
              />
            </div>

            {/* Caption */}
            <div className="px-5 py-4">
              <p className="font-semibold" style={{ color: 'var(--wm-text)' }}>
                {lightboxItem.title}
              </p>
              {lightboxItem.description ? (
                <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
                  {lightboxItem.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
