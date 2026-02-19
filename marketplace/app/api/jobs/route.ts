import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidEircode, normalizeEircode } from '@/lib/eircode';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const eircode = normalizeEircode(body.eircode || '');

  if (!isValidEircode(eircode)) {
    return NextResponse.json({ error: 'Geçerli bir Eircode giriniz.' }, { status: 400 });
  }

  const { data, error } = await supabase.from('jobs').insert({
    customer_id: body.customer_id,
    title: body.title,
    category: body.category,
    description: body.description,
    eircode,
    budget_range: body.budget_range,
    photo_urls: body.photo_urls ?? [],
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data }, { status: 201 });
}
