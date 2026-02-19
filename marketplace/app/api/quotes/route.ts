import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase.from('quotes').insert({
    job_id: body.job_id,
    pro_id: body.pro_id,
    quote_amount_cents: body.quote_amount_cents,
    message: body.message,
    availability_slots: body.availability_slots,
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ quote: data }, { status: 201 });
}
