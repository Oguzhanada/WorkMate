// Permanent redirect — this page has moved to /en/checkout/success
import { redirect } from 'next/navigation';

export default function CheckoutSuccessRedirect() {
  redirect('/en/checkout/success');
}
