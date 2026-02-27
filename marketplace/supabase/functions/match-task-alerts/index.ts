import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const TASK_ALERT_SECRET = Deno.env.get('TASK_ALERT_SECRET') ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseBudgetLowerBound(budgetRange: string | null) {
  if (!budgetRange) return null;
  const match = budgetRange.replace(/,/g, '').match(/(\d+)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function containsKeyword(text: string, keywords: string[]) {
  if (keywords.length === 0) return true;
  const value = text.toLowerCase();
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (TASK_ALERT_SECRET) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (authHeader !== `Bearer ${TASK_ALERT_SECRET}` && authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const body = await request.json().catch(() => null);
  const jobId = typeof body?.jobId === 'string' ? body.jobId : '';
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'jobId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: job } = await admin
    .from('jobs')
    .select('id,title,description,category_id,county,budget_range,task_type')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) {
    return new Response(JSON.stringify({ error: 'Job not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: alerts } = await admin
    .from('task_alerts')
    .select('id,provider_id,keywords,categories,counties,task_types,budget_min,urgency_levels')
    .eq('enabled', true);

  const budgetLowerBound = parseBudgetLowerBound(job.budget_range);
  const combinedText = `${job.title ?? ''} ${job.description ?? ''}`.trim();
  const urgencyHint = combinedText.toLowerCase();
  const matchedProviderIds: string[] = [];

  for (const alert of alerts ?? []) {
    const counties = alert.counties ?? [];
    const categories = alert.categories ?? [];
    const taskTypes = alert.task_types ?? [];
    const urgencyLevels = alert.urgency_levels ?? [];
    const keywords = alert.keywords ?? [];

    if (counties.length > 0 && job.county && !counties.includes(job.county)) continue;
    if (categories.length > 0 && job.category_id && !categories.includes(job.category_id)) continue;
    if (taskTypes.length > 0 && job.task_type && !taskTypes.includes(job.task_type)) continue;
    if (urgencyLevels.length > 0) {
      const hasUrgencyMatch = urgencyLevels.some((level: string) => urgencyHint.includes(level));
      if (!hasUrgencyMatch) continue;
    }
    if (alert.budget_min && budgetLowerBound !== null && budgetLowerBound < Number(alert.budget_min)) continue;
    if (!containsKeyword(combinedText, keywords)) continue;

    matchedProviderIds.push(alert.provider_id);

    await admin.from('notifications').insert({
      user_id: alert.provider_id,
      type: 'job_alert',
      payload: {
        alert_id: alert.id,
        job_id: job.id,
        title: job.title,
        county: job.county,
      },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      matched_count: matchedProviderIds.length,
      matched_provider_ids: matchedProviderIds,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
