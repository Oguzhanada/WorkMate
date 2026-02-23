import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getUserRole } from '@/lib/auth/rbac';
import { capturePaymentSchema } from '@/lib/validation/api';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole(supabase, user.id);
  if (role !== 'customer' && role !== 'admin') {
    return NextResponse.json({ error: 'Only customers can capture payment' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = capturePaymentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { payment_intent_id } = parsed.data;
  const captured = await stripe.paymentIntents.capture(payment_intent_id);
  return NextResponse.json({ status: captured.status, payment_intent_id: captured.id });
}
