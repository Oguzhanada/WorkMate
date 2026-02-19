import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const { stripe_account_id } = await request.json();

  const accountLink = await stripe.accountLinks.create({
    account: stripe_account_id,
    type: 'account_onboarding',
    refresh_url: `${process.env.NEXT_PUBLIC_PLATFORM_BASE_URL}/dashboard/pro?refresh=1`,
    return_url: `${process.env.NEXT_PUBLIC_PLATFORM_BASE_URL}/dashboard/pro?onboarding=done`,
  });

  return NextResponse.json({ url: accountLink.url });
}
