'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '@/app/[locale]/inner.module.css';

type PaymentState = {
  status: 'authorized' | 'captured' | 'cancelled' | 'refunded';
  stripe_payment_intent_id: string;
};

type QuoteActionsProps = {
  jobId: string;
  jobStatus: string;
  quoteId: string;
  quoteStatus: string;
  quoteAmountCents: number;
  proId: string;
  customerId: string;
  connectedAccountId: string | null;
  isAcceptedQuote: boolean;
  payment: PaymentState | null;
};

export default function QuoteActions({
  jobId,
  jobStatus,
  quoteId,
  quoteStatus,
  quoteAmountCents,
  proId,
  customerId,
  connectedAccountId,
  isAcceptedQuote,
  payment,
}: QuoteActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<'' | 'accept' | 'hold' | 'capture'>('');
  const [feedback, setFeedback] = useState('');

  const acceptQuote = async () => {
    setPendingAction('accept');
    setFeedback('');

    const response = await fetch(`/api/jobs/${jobId}/accept-quote`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote_id: quoteId }),
    });
    const payload = await response.json();

    setPendingAction('');
    if (!response.ok) {
      setFeedback(payload.error || 'Quote could not be selected.');
      return;
    }

    setFeedback('Quote selected. You can now proceed with secure hold payment.');
    router.refresh();
  };

  const startSecureHold = async () => {
    if (!connectedAccountId) {
      setFeedback('This professional has not completed payout setup yet.');
      return;
    }

    setPendingAction('hold');
    setFeedback('');

    const response = await fetch('/api/connect/create-secure-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_cents: quoteAmountCents,
        connected_account_id: connectedAccountId,
        quote_id: quoteId,
        job_id: jobId,
        customer_id: customerId,
        pro_id: proId,
      }),
    });

    const payload = await response.json();
    setPendingAction('');

    if (!response.ok) {
      setFeedback(payload.error || 'Secure hold could not be started.');
      return;
    }

    if (payload.checkout_url) {
      window.location.href = payload.checkout_url;
      return;
    }

    setFeedback('Checkout URL was not returned.');
  };

  const capturePayment = async () => {
    if (!payment?.stripe_payment_intent_id) {
      setFeedback('Payment intent not found for capture.');
      return;
    }

    setPendingAction('capture');
    setFeedback('');

    const response = await fetch('/api/connect/capture-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_intent_id: payment.stripe_payment_intent_id }),
    });

    const payload = await response.json();
    setPendingAction('');

    if (!response.ok) {
      setFeedback(payload.error || 'Payment could not be released.');
      return;
    }

    setFeedback('Payment released and captured successfully.');
    router.refresh();
  };

  return (
    <div className={styles.actions}>
      {!isAcceptedQuote && !payment ? (
        <button type="button" className={styles.secondary} disabled={pendingAction !== ''} onClick={acceptQuote}>
          {pendingAction === 'accept' ? 'Selecting...' : 'Select this quote'}
        </button>
      ) : null}

      {isAcceptedQuote && !payment ? (
        <button type="button" className={styles.primary} disabled={pendingAction !== ''} onClick={startSecureHold}>
          {pendingAction === 'hold' ? 'Redirecting...' : 'Pay with Secure Hold'}
        </button>
      ) : null}

      {isAcceptedQuote && payment?.status === 'authorized' ? (
        <button
          type="button"
          className={styles.primary}
          disabled={pendingAction !== '' || jobStatus !== 'completed'}
          onClick={capturePayment}
        >
          {pendingAction === 'capture' ? 'Releasing...' : 'Job completed, release payment'}
        </button>
      ) : null}

      {payment?.status === 'captured' ? <span className={styles.muted}>Payment captured.</span> : null}
      {jobStatus !== 'completed' && payment?.status === 'authorized' ? (
        <span className={styles.muted}>Set job status to &quot;completed&quot; before capture.</span>
      ) : null}
      {quoteStatus === 'rejected' ? <span className={styles.muted}>This quote was rejected.</span> : null}
      {feedback ? <span className={styles.muted}>{feedback}</span> : null}
    </div>
  );
}
