'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'pending' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      queueMicrotask(() => {
        setStatus('error');
        setMessage('Checkout session was not found.');
      });
      return;
    }

    let active = true;

    async function finalizeHold() {
      setStatus('pending');
      const response = await fetch('/api/connect/finalize-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkout_session_id: sessionId }),
      });
      const payload = await response.json();

      if (!active) {
        return;
      }

      if (!response.ok) {
        setStatus('error');
        setMessage(payload.error || 'Secure hold could not be finalized.');
        return;
      }

      setStatus('ok');
      setMessage('Payment hold created successfully. After job completion, capture the payment to release it to the professional.');
    }

    queueMicrotask(() => { if (active) finalizeHold(); });

    return () => {
      active = false;
    };
  }, [searchParams]);

  return (
    <main className="p-6">
      {status === 'pending' ? <p>Verifying secure hold...</p> : null}
      {status === 'ok' ? <p>{message}</p> : null}
      {status === 'error' ? <p>{message}</p> : null}
    </main>
  );
}
