'use client';

type SecureHoldButtonProps = {
  amountCents: number;
  connectedAccountId: string;
  quoteId: string;
  jobId: string;
  customerId: string;
  proId: string;
};

export default function SecureHoldButton({
  amountCents,
  connectedAccountId,
  quoteId,
  jobId,
  customerId,
  proId,
}: SecureHoldButtonProps) {
  const createSecureHold = async () => {
    const res = await fetch('/api/connect/create-secure-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_cents: amountCents, connected_account_id: connectedAccountId, quote_id: quoteId, job_id: jobId, customer_id: customerId, pro_id: proId }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Payment could not be started');
      return;
    }

    if (data.checkout_url) {
      window.location.href = data.checkout_url;
      return;
    }

    alert('Checkout redirect URL was not returned.');
  };

  return (
    <button onClick={createSecureHold} className="rounded bg-[var(--wm-navy)] px-4 py-2 text-white">
      Pay with Secure Hold
    </button>
  );
}
