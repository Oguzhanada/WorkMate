'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import styles from '@/components/dashboard/dashboard.module.css';

type MessageItem = {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
};

type Props = {
  jobId: string;
  quoteId?: string;
  visibility: 'public' | 'private';
  receiverId?: string;
  title: string;
};

export default function JobMessagePanel({ jobId, quoteId, visibility, receiverId, title }: Props) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null>(null);

  const loadMessages = async () => {
    const query = new URLSearchParams({ job_id: jobId, visibility });
    if (quoteId) query.set('quote_id', quoteId);

    const response = await fetch(`/api/messages?${query.toString()}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Messages could not be loaded.');
      return;
    }
    setMessages(payload.messages ?? []);
  };

  useEffect(() => {
    // Initial load
    loadMessages();

    // Subscribe to realtime inserts on job_messages for this job
    const supabase = getSupabaseBrowserClient();
    const channelName = `job-messages:${jobId}:${visibility}${quoteId ? `:${quoteId}` : ''}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_messages',
          filter: `job_id=eq.${jobId}`,
        },
        () => {
          // Reload messages whenever a new one arrives
          loadMessages();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, quoteId, visibility]);

  const submit = async () => {
    if (!text.trim()) return;
    if (visibility === 'private' && !receiverId) {
      setError('Receiver information is missing.');
      return;
    }

    setIsPending(true);
    setError('');

    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        quote_id: quoteId,
        visibility,
        receiver_id: receiverId,
        message: text.trim(),
      }),
    });

    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setError(payload.error || 'Message could not be sent.');
      return;
    }

    setText('');
    // Realtime subscription will pick up the new message — no manual reload needed
  };

  return (
    <div className={styles.card}>
      <p className={styles.title}>{title}</p>
      {messages.length === 0 ? <p className={styles.meta}>No messages yet.</p> : null}
      <div className={styles.stack}>
        {messages.slice(-8).map((item) => (
          <div key={item.id} className={styles.card}>
            <p className={styles.meta}>
              <strong>{item.sender_name}</strong> • {new Date(item.created_at).toLocaleString()}
            </p>
            <p className={styles.desc}>{item.message}</p>
          </div>
        ))}
      </div>
      {error ? <p className={styles.feedback}>{error}</p> : null}
      <textarea
        className={styles.textarea}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={visibility === 'public' ? 'Write a public note...' : 'Write a private message...'}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.primary} disabled={isPending} onClick={submit}>
          {isPending ? 'Sending...' : 'Send message'}
        </button>
      </div>
    </div>
  );
}
