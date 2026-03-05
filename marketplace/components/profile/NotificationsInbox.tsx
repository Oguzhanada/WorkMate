"use client";

import Link from 'next/link';
import {useMemo, useState} from 'react';
import {usePathname} from 'next/navigation';
import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import styles from './notifications-inbox.module.css';

type NotificationItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
};

function getNotificationText(item: NotificationItem) {
  if (item.type === 'new_quote') return 'New quote received';
  if (item.type === 'new_message') return 'New private message';
  if (item.type === 'new_job_lead') return `New job lead: ${String(item.payload.title ?? 'Listing')}`;
  if (item.type === 'admin_verification_update') {
    return `Verification review updated: ${String(item.payload.status ?? 'updated')}`;
  }
  if (item.type === 'admin_document_update') {
    return `Document review updated: ${String(item.payload.decision ?? 'updated')}`;
  }
  if (item.type === 'job_pending_review') return 'A new job is waiting for admin review.';
  if (item.type === 'job_review_approved') return 'Your job was approved and published.';
  if (item.type === 'job_review_rejected') return `Your job was rejected: ${String(item.payload.reason ?? 'Please update and resubmit.')}`;
  if (item.type === 'dispute_opened') return 'A dispute was opened for one of your jobs.';
  if (item.type === 'dispute_response_received') return 'New provider response added to your dispute.';
  if (item.type === 'dispute_resolved') return 'A dispute has been resolved by admin.';
  if (item.type === 'dispute_escalated') return 'A dispute was escalated due to deadline.';
  if (item.type === 'payment_auto_released') return 'Payment was auto-released for a completed job.';
  if (item.type === 'payment_release_reminder') return 'Provider requested payment release confirmation.';
  return 'New notification';
}

function getNotificationHref(item: NotificationItem, localeRoot: string) {
  if (item.type === 'new_quote') return withLocalePrefix(localeRoot, '/dashboard/customer');
  if (item.type === 'new_message') return withLocalePrefix(localeRoot, '/messages');
  if (item.type.startsWith('dispute_')) return withLocalePrefix(localeRoot, '/dashboard/disputes');
  if (item.type.startsWith('job_review_')) return withLocalePrefix(localeRoot, '/dashboard/customer');
  if (item.type === 'payment_auto_released' || item.type === 'payment_release_reminder') {
    return withLocalePrefix(localeRoot, '/dashboard/customer');
  }
  return withLocalePrefix(localeRoot, '/profile');
}

export default function NotificationsInbox({initialItems}: {initialItems: NotificationItem[]}) {
  const pathname = usePathname() || '/';
  const localeRoot = useMemo(() => getLocaleRoot(pathname), [pathname]);
  const [items, setItems] = useState(initialItems);
  const unreadCount = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  const markRead = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    const stamp = new Date().toISOString();
    await supabase.from('notifications').update({read_at: stamp}).eq('id', id);
    setItems((current) => current.map((item) => (item.id === id ? {...item, read_at: stamp} : item)));
  };

  const markAllRead = async () => {
    const supabase = getSupabaseBrowserClient();
    const stamp = new Date().toISOString();
    await supabase.from('notifications').update({read_at: stamp}).is('read_at', null);
    setItems((current) => current.map((item) => ({...item, read_at: stamp})));
  };

  const removeOne = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('notifications').delete().eq('id', id);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.actions}>
        {unreadCount > 0 ? (
          <button type="button" className={styles.btnPrimary} onClick={markAllRead}>
            Mark all as read ({unreadCount})
          </button>
        ) : null}
      </div>
      {items.length === 0 ? <p className={styles.empty}>No notifications.</p> : null}
      {items.map((item) => (
        <article key={item.id} className={`${styles.row} ${!item.read_at ? styles.rowUnread : ''}`}>
          <p className={styles.line}>{getNotificationText(item)}</p>
          {typeof item.payload.note === 'string' && item.payload.note ? (
            <p className={styles.meta}>Admin note: {item.payload.note}</p>
          ) : null}
          <p className={styles.meta}>{new Date(item.created_at).toLocaleString()}</p>
          <div className={styles.actions}>
            <Link href={getNotificationHref(item, localeRoot)} className={styles.btnGhost}>
              Open
            </Link>
            {!item.read_at ? (
              <button type="button" className={styles.btnGhost} onClick={() => markRead(item.id)}>
                Mark read
              </button>
            ) : null}
            <button type="button" className={styles.btnGhost} onClick={() => removeOne(item.id)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
