import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiError, apiServerError } from '@/lib/api/error-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;

  if (!categoryId) {
    return apiError('categoryId required', 400);
  }

  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('quotes')
    .select('quote_amount_cents,jobs!job_id(category_id)')
    .eq('jobs.category_id', categoryId)
    .eq('status', 'accepted')
    .not('quote_amount_cents', 'is', null)
    .gte('quote_amount_cents', 1)
    .order('quote_amount_cents', { ascending: true })
    .limit(200);

  if (error) {
    return apiServerError(error.message);
  }

  const amounts = (data ?? [])
    .map((row) => Number(row.quote_amount_cents))
    .filter((v) => Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);

  if (amounts.length < 3) {
    return NextResponse.json({ estimate: null });
  }

  const p25 = amounts[Math.floor(amounts.length * 0.25)];
  const p75 = amounts[Math.floor(amounts.length * 0.75)];
  const median = amounts[Math.floor(amounts.length * 0.5)];

  return NextResponse.json({
    estimate: {
      p25Cents: p25,
      p75Cents: p75,
      medianCents: median,
      sampleSize: amounts.length,
    },
  });
}
