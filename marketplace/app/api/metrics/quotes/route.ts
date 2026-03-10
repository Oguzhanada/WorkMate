import { NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const supabase = getSupabaseServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id,created_at')
    .gte('created_at', since)
    .in('status', ['open', 'quoted', 'accepted', 'in_progress', 'completed']);

  if (jobsError) {
    return NextResponse.json({ error: jobsError.message }, { status: 400 });
  }

  const jobIds = (jobs ?? []).map((job) => job.id);
  if (jobIds.length === 0) {
    return NextResponse.json({
      jobs_last_24h: 0,
      jobs_with_3to5_quotes: 0,
      jobs_with_3plus_quotes: 0,
      first_quote_median_minutes: null,
    });
  }

  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('id,job_id,created_at')
    .in('job_id', jobIds);

  if (quotesError) {
    return NextResponse.json({ error: quotesError.message }, { status: 400 });
  }

  const quoteCountByJob = new Map<string, number>();
  const firstQuoteMinutes: number[] = [];

  const jobCreatedAtById = new Map((jobs ?? []).map((job) => [job.id, new Date(job.created_at).getTime()]));
  for (const quote of quotes ?? []) {
    quoteCountByJob.set(quote.job_id, (quoteCountByJob.get(quote.job_id) ?? 0) + 1);
  }

  for (const jobId of jobIds) {
    const relevant = (quotes ?? [])
      .filter((quote) => quote.job_id === jobId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (!relevant.length) continue;
    const start = jobCreatedAtById.get(jobId) ?? 0;
    const first = new Date(relevant[0].created_at).getTime();
    if (start > 0 && first >= start) {
      firstQuoteMinutes.push((first - start) / 60000);
    }
  }

  const quoteCounts = jobIds.map((id) => quoteCountByJob.get(id) ?? 0);
  const jobsWith3to5 = quoteCounts.filter((count) => count >= 3 && count <= 5).length;
  const jobsWith3plus = quoteCounts.filter((count) => count >= 3).length;

  firstQuoteMinutes.sort((a, b) => a - b);
  const median =
    firstQuoteMinutes.length === 0
      ? null
      : firstQuoteMinutes.length % 2 === 1
        ? firstQuoteMinutes[Math.floor(firstQuoteMinutes.length / 2)]
        : (firstQuoteMinutes[firstQuoteMinutes.length / 2 - 1] + firstQuoteMinutes[firstQuoteMinutes.length / 2]) / 2;

  return NextResponse.json({
    jobs_last_24h: jobIds.length,
    jobs_with_3to5_quotes: jobsWith3to5,
    jobs_with_3plus_quotes: jobsWith3plus,
    first_quote_median_minutes: median ? Number(median.toFixed(1)) : null,
  });
}
