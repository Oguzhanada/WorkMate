import Stripe from 'npm:stripe@20.3.1';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const CRON_SECRET = Deno.env.get('CRON_SECRET');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or STRIPE_SECRET_KEY.');
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
});

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const nowIso = new Date().toISOString();

  const { data: dueJobs, error: dueJobsError } = await admin
    .from('jobs')
    .select('id,customer_id,accepted_quote_id,auto_release_at,payment_released_at,status')
    .eq('status', 'completed')
    .is('payment_released_at', null)
    .not('auto_release_at', 'is', null)
    .lte('auto_release_at', nowIso)
    .limit(100);

  if (dueJobsError) {
    return new Response(JSON.stringify({ error: dueJobsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let processed = 0;
  const failures: Array<{ job_id: string; error: string }> = [];

  for (const job of dueJobs ?? []) {
    const { data: payment } = await admin
      .from('payments')
      .select('id,pro_id,stripe_payment_intent_id,status')
      .eq('job_id', job.id)
      .eq('auto_release_eligible', true)
      .eq('status', 'authorized')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment) continue;

    try {
      await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);

      const timestamp = new Date().toISOString();
      await admin
        .from('payments')
        .update({
          status: 'captured',
          auto_release_processed_at: timestamp,
        })
        .eq('id', payment.id);

      await admin
        .from('jobs')
        .update({
          payment_released_at: timestamp,
          payment_on_hold: false,
        })
        .eq('id', job.id);

      await admin.from('notifications').insert([
        {
          user_id: job.customer_id,
          type: 'payment_auto_released',
          payload: {
            job_id: job.id,
            payment_id: payment.id,
            released_at: timestamp,
          },
        },
        {
          user_id: payment.pro_id,
          type: 'payment_auto_released',
          payload: {
            job_id: job.id,
            payment_id: payment.id,
            released_at: timestamp,
          },
        },
      ]);

      processed += 1;
    } catch (error) {
      failures.push({
        job_id: job.id,
        error: error instanceof Error ? error.message : 'Capture failed',
      });
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      scanned_jobs: (dueJobs ?? []).length,
      processed,
      failures,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});