'use client';

export default function SecureHoldButton({ amountCents, connectedAccountId, quoteId, jobId, customerId, proId }: any) {
  const createSecureHold = async () => {
    const res = await fetch('/api/connect/create-secure-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_cents: amountCents, connected_account_id: connectedAccountId, quote_id: quoteId, job_id: jobId, customer_id: customerId, pro_id: proId }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Ödeme başlatılamadı');
      return;
    }

    window.location.href = `/checkout/success?pi=${data.payment_intent_id}`;
  };

  return (
    <button onClick={createSecureHold} className="rounded bg-slate-900 px-4 py-2 text-white">
      Secure Hold ile Öde
    </button>
  );
}
