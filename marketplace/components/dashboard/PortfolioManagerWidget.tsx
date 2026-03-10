'use client';

import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

const MAX_ITEMS = 12;

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  display_order: number;
};

type FormState = {
  title: string;
  description: string;
  image_url: string;
};

const EMPTY_FORM: FormState = { title: '', description: '', image_url: '' };

export default function PortfolioManagerWidget() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const titleRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/portfolio');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.title.trim()) {
      setError('Title is required.');
      titleRef.current?.focus();
      return;
    }
    if (!form.image_url.trim()) {
      setError('Image URL is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/profile/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         form.title.trim(),
          description:   form.description.trim() || undefined,
          image_url:     form.image_url.trim(),
          display_order: items.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to add item.');
      } else {
        setForm(EMPTY_FORM);
        setSuccess('Item added successfully.');
        await fetchItems();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/profile/portfolio/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to delete item.');
      } else {
        setSuccess('Item removed.');
        await fetchItems();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const atMax = items.length >= MAX_ITEMS;

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold" style={{ color: 'var(--wm-text)' }}>
          Work Gallery
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            background: atMax ? 'var(--wm-destructive-faint)' : 'var(--wm-primary-faint)',
            color:      atMax ? 'var(--wm-destructive)'       : 'var(--wm-primary-dark)',
          }}
        >
          {items.length} / {MAX_ITEMS}
        </span>
      </div>

      {/* ── Feedback banners ──────────────────────────────────────────── */}
      {error ? (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--wm-destructive-faint)', color: 'var(--wm-destructive)' }}>
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--wm-success-faint)', color: 'var(--wm-success)' }}>
          {success}
        </p>
      ) : null}

      {/* ── Existing items grid ───────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-xl"
              style={{ background: 'var(--wm-surface)' }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No portfolio items yet"
          description="Add your first work photo below to showcase your skills."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-xl"
              style={{ border: '1px solid var(--wm-border)' }}
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {/* Overlay with title and delete */}
              <div
                className="absolute inset-0 flex flex-col items-start justify-end p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{ background: 'rgba(15,23,42,0.72)' }}
              >
                <p className="mb-1 truncate text-xs font-semibold" style={{ color: 'var(--wm-surface)' }}>
                  {item.title}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  aria-label={`Remove ${item.title}`}
                >
                  {deletingId === item.id ? 'Removing…' : 'Remove'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Item form ─────────────────────────────────────────────── */}
      {!atMax ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-xl p-4"
          style={{
            border: '1px solid var(--wm-border)',
            background: 'var(--wm-surface)',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--wm-muted)' }}>
            Add New Item
          </p>

          <div className="space-y-1">
            <label
              htmlFor="portfolio-title"
              className="block text-xs font-medium"
              style={{ color: 'var(--wm-text)' }}
            >
              Title <span style={{ color: 'var(--wm-destructive)' }}>*</span>
            </label>
            <input
              id="portfolio-title"
              ref={titleRef}
              type="text"
              maxLength={100}
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Kitchen renovation"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                border: '1px solid var(--wm-border)',
                background: 'var(--wm-bg)',
                color: 'var(--wm-text)',
              }}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="portfolio-image-url"
              className="block text-xs font-medium"
              style={{ color: 'var(--wm-text)' }}
            >
              Image URL <span style={{ color: 'var(--wm-destructive)' }}>*</span>
            </label>
            <input
              id="portfolio-image-url"
              type="url"
              required
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="https://example.com/photo.jpg"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                border: '1px solid var(--wm-border)',
                background: 'var(--wm-bg)',
                color: 'var(--wm-text)',
              }}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="portfolio-description"
              className="block text-xs font-medium"
              style={{ color: 'var(--wm-text)' }}
            >
              Description <span style={{ color: 'var(--wm-muted)' }}>(optional)</span>
            </label>
            <textarea
              id="portfolio-description"
              maxLength={500}
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the work…"
              className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                border: '1px solid var(--wm-border)',
                background: 'var(--wm-bg)',
                color: 'var(--wm-text)',
              }}
            />
          </div>

          <Button type="submit" variant="primary" size="sm" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add to Gallery'}
          </Button>
        </form>
      ) : (
        <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
          Gallery is full ({MAX_ITEMS} items). Remove an item to add a new one.
        </p>
      )}
    </div>
  );
}
