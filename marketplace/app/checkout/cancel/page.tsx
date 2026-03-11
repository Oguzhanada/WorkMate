// Permanent redirect — this page has moved to /en/checkout/cancel
import { redirect } from 'next/navigation';

export default function CheckoutCancelRedirect() {
  redirect('/en/checkout/cancel');
}
