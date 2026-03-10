'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import Button from '@/components/ui/Button';

type NotificationRow = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

const POLL_INTERVAL_MS = 30_000;
const DROPDOWN_LIMIT = 5;

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function getTitle(n: NotificationRow): string {
  return (
    n.title ??
    (n.payload?.title as string | undefined) ??
    'Notification'
  );
}

function truncate(str: string | null | undefined, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function NotificationBell() {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/notifications?unread=true&limit=${DROPDOWN_LIMIT}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const json = (await res.json()) as { notifications: NotificationRow[] };
      setItems(json.notifications ?? []);
    } catch {
      // Silently swallow — bell should never break the page
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchUnread]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setItems([]);
    } catch {
      // swallow
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // swallow
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // swallow
    }
  };

  const notificationsHref = withLocalePrefix(localeRoot, '/notifications');

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Bell button */}
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        onClick={() => setOpen((v) => !v)}
        className="!p-0"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          border: '1px solid var(--wm-border)',
          background: open ? 'var(--wm-primary-faint)' : 'transparent',
          color: 'var(--wm-text)',
        }}
      >
        {/* Bell SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              background: 'var(--wm-primary)',
              color: 'var(--wm-on-primary, #ffffff)',
              fontSize: '10px',
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
              padding: '0 3px',
              boxShadow: '0 0 0 2px var(--wm-bg, #ffffff)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '320px',
            borderRadius: '16px',
            border: '1px solid var(--wm-border)',
            background: 'var(--wm-surface)',
            boxShadow: 'var(--wm-shadow-2xl)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px 10px',
              borderBottom: '1px solid var(--wm-border)',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--wm-navy)',
                letterSpacing: '-0.01em',
              }}
            >
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '1px 7px',
                    borderRadius: '99px',
                    background: 'var(--wm-primary-faint)',
                    color: 'var(--wm-primary-dark)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </span>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={loading}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--wm-primary-dark)',
                  padding: '2px 4px',
                }}
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification list */}
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {items.length === 0 && (
              <li
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--wm-muted)',
                }}
              >
                You are all caught up!
              </li>
            )}

            {items.map((n) => (
              <li
                key={n.id}
                onClick={() => handleMarkOneRead(n.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--wm-border)',
                  background: n.read_at ? 'transparent' : 'var(--wm-primary-faint)',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
              >
                {/* Unread dot */}
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    marginTop: '5px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: n.read_at ? 'transparent' : 'var(--wm-primary)',
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      fontWeight: n.read_at ? 500 : 700,
                      color: 'var(--wm-text)',
                      lineHeight: 1.4,
                    }}
                  >
                    {truncate(getTitle(n), 60)}
                  </p>
                  {n.body && (
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: '12px',
                        color: 'var(--wm-muted)',
                        lineHeight: 1.4,
                      }}
                    >
                      {truncate(n.body, 80)}
                    </p>
                  )}
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '11px',
                      color: 'var(--wm-subtle)',
                    }}
                  >
                    {relativeTime(n.created_at)}
                  </p>
                </div>

                {/* Dismiss button */}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Dismiss notification"
                  onClick={(e) => handleDismiss(n.id, e as React.MouseEvent)}
                  style={{
                    flexShrink: 0,
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    color: 'var(--wm-muted)',
                    fontSize: '14px',
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              textAlign: 'center',
            }}
          >
            <Link
              href={notificationsHref}
              onClick={() => setOpen(false)}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--wm-primary-dark)',
                textDecoration: 'none',
              }}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
