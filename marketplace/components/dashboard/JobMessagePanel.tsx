'use client';

import { useEffect, useState } from 'react';
import styles from './dashboard.module.css';

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

  const loadMessages = async () => {
    const query = new URLSearchParams({
      job_id: jobId,
      visibility,
    });
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
    let active = true;
    queueMicrotask(() => { if (active) loadMessages(); });
    const timer = setInterval(loadMessages, 15000);
    return () => { active = false; clearInterval(timer); };
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
    await loadMessages();
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
