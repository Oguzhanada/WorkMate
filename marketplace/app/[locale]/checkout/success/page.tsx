import { Suspense } from 'react';
import CheckoutSuccessClient from '@/components/payments/CheckoutSuccessClient';

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className="p-6">Verifying secure hold...</main>}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
