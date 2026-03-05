import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const service = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const suffix = Date.now();
const password = 'WorkMate!Qa2026';
const users = {
  customer: { email: `qa.tt.customer.${suffix}@example.com`, fullName: `QA TT Customer ${suffix}` },
  providerA: { email: `qa.tt.provider.a.${suffix}@example.com`, fullName: `QA TT Provider A ${suffix}` },
  providerB: { email: `qa.tt.provider.b.${suffix}@example.com`, fullName: `QA TT Provider B ${suffix}` },
};

function log(step, message) {
  console.log(`[${step}] ${message}`);
}

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const found = (data.users ?? []).find((item) => (item.email ?? '').toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (!data.users || data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureFreshAuthUser({ email, fullName }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const { error } = await service.auth.admin.deleteUser(existing.id);
    if (error) throw new Error(`delete user failed: ${error.message}`);
  }
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, name: fullName },
  });
  if (error || !data.user) throw new Error(`create user failed: ${error?.message ?? 'unknown error'}`);
  return data.user.id;
}

async function ensureRole(userId, role) {
  const { error } = await service.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
  if (error) throw new Error(`role upsert failed: ${error.message}`);
}

async function buildAuthedCookieHeader(email) {
  const jar = new Map();
  const client = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return Array.from(jar.entries()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          if (!cookie.value || cookie.options?.maxAge === 0) {
            jar.delete(cookie.name);
          } else {
            jar.set(cookie.name, cookie.value);
          }
        }
      },
    },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signInWithPassword failed for ${email}: ${error.message}`);
  const header = Array.from(jar.entries()).map(([key, value]) => `${key}=${value}`).join('; ');
  if (!header) throw new Error(`No auth cookies generated for ${email}`);
  return header;
}

async function apiFetch(path, { method = 'GET', cookieHeader, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { status: response.status, payload };
}

function assertStatus(actual, expected, label, payload) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${expected}, got ${actual}. Payload=${JSON.stringify(payload)}`);
  }
}

async function run() {
  const { error: timeEntriesTableError } = await service.from('time_entries').select('id').limit(1);
  if (timeEntriesTableError) {
    throw new Error(`time_entries table is not accessible: ${timeEntriesTableError.message}`);
  }

  log('setup', 'Creating users');
  const customerId = await ensureFreshAuthUser(users.customer);
  const providerAId = await ensureFreshAuthUser(users.providerA);
  const providerBId = await ensureFreshAuthUser(users.providerB);

  const profilePatches = [
    {
      id: customerId,
      role: 'customer',
      full_name: users.customer.fullName,
      phone: '+353830100001',
      is_verified: false,
      verification_status: 'unverified',
      id_verification_status: 'none',
    },
    {
      id: providerAId,
      role: 'verified_pro',
      full_name: users.providerA.fullName,
      phone: '+353830100002',
      is_verified: true,
      verification_status: 'verified',
      id_verification_status: 'approved',
    },
    {
      id: providerBId,
      role: 'verified_pro',
      full_name: users.providerB.fullName,
      phone: '+353830100003',
      is_verified: true,
      verification_status: 'verified',
      id_verification_status: 'approved',
    },
  ];

  for (const profile of profilePatches) {
    const { error } = await service.from('profiles').upsert(profile, { onConflict: 'id' });
    if (error) throw new Error(`profile upsert failed: ${error.message}`);
  }

  await ensureRole(customerId, 'customer');
  await ensureRole(providerAId, 'verified_pro');
  await ensureRole(providerBId, 'verified_pro');

  const { data: categories, error: categoryError } = await service
    .from('categories')
    .select('id,name')
    .eq('is_active', true)
    .limit(1);
  if (categoryError || !categories || categories.length === 0) {
    throw new Error(`Cannot resolve active category: ${categoryError?.message ?? 'none found'}`);
  }
  const categoryId = categories[0].id;

  const customerCookie = await buildAuthedCookieHeader(users.customer.email);
  const providerACookie = await buildAuthedCookieHeader(users.providerA.email);
  const providerBCookie = await buildAuthedCookieHeader(users.providerB.email);

  log('jobs', 'Creating job via API');
  const jobCreate = await apiFetch('/api/jobs', {
    method: 'POST',
    cookieHeader: customerCookie,
    body: {
      title: `QA Time Tracking ${suffix}`,
      category_id: categoryId,
      description: 'Hourly work for API-only smoke validation.',
      eircode: 'D02Y006',
      county: 'Dublin',
      locality: 'Dublin',
      budget_range: '€200-€500',
      task_type: 'in_person',
      job_mode: 'direct_request',
      target_provider_id: providerAId,
      photo_urls: [],
    },
  });
  assertStatus(jobCreate.status, 201, 'create job', jobCreate.payload);
  const jobId = jobCreate.payload?.job?.id;
  if (!jobId) throw new Error('Job id missing');

  const { error: approveError } = await service
    .from('jobs')
    .update({ review_status: 'approved', status: 'open' })
    .eq('id', jobId);
  if (approveError) throw new Error(`Job approval update failed: ${approveError.message}`);

  log('quotes', 'Provider A submits quote');
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  const quoteCreate = await apiFetch('/api/quotes', {
    method: 'POST',
    cookieHeader: providerACookie,
    body: {
      job_id: jobId,
      quote_amount_cents: 8500,
      message: 'Hourly quote for time-tracking flow',
      estimated_duration: '2 hours',
      includes: ['Labour'],
      excludes: [],
      availability_slots: [{ start: now.toISOString(), end: later.toISOString() }],
    },
  });
  assertStatus(quoteCreate.status, 201, 'create quote', quoteCreate.payload);
  const quoteId = quoteCreate.payload?.quote?.id;
  if (!quoteId) throw new Error('Quote id missing');

  log('quotes', 'Customer accepts quote');
  const accept = await apiFetch(`/api/jobs/${jobId}/accept-quote`, {
    method: 'PATCH',
    cookieHeader: customerCookie,
    body: { quote_id: quoteId },
  });
  assertStatus(accept.status, 200, 'accept quote', accept.payload);

  log('time', 'Non-assigned provider must be blocked');
  const blocked = await apiFetch(`/api/jobs/${jobId}/time-entries`, {
    method: 'POST',
    cookieHeader: providerBCookie,
    body: { action: 'start', description: 'Should fail' },
  });
  if (![403, 404].includes(blocked.status)) {
    throw new Error(`provider B start timer expected 403/404, got ${blocked.status}. Payload=${JSON.stringify(blocked.payload)}`);
  }

  log('time', 'Assigned provider starts/stops timer');
  const startedAt = new Date(Date.now() - 90 * 60 * 1000).toISOString();
  const start = await apiFetch(`/api/jobs/${jobId}/time-entries`, {
    method: 'POST',
    cookieHeader: providerACookie,
    body: {
      action: 'start',
      description: 'Installation and testing',
      hourly_rate: 9000,
      started_at: startedAt,
    },
  });
  assertStatus(start.status, 201, 'start timer', start.payload);
  const entryId = start.payload?.entry?.id;
  if (!entryId) throw new Error('Time entry id missing');

  const stop = await apiFetch(`/api/jobs/${jobId}/time-entries`, {
    method: 'POST',
    cookieHeader: providerACookie,
    body: { action: 'stop', entry_id: entryId },
  });
  assertStatus(stop.status, 200, 'stop timer', stop.payload);

  const providerList = await apiFetch(`/api/jobs/${jobId}/time-entries`, {
    method: 'GET',
    cookieHeader: providerACookie,
  });
  assertStatus(providerList.status, 200, 'provider list entries', providerList.payload);
  if (!Array.isArray(providerList.payload?.entries) || providerList.payload.entries.length === 0) {
    throw new Error('Provider cannot see time entries');
  }

  log('time', 'Customer approves entry');
  const approve = await apiFetch(`/api/jobs/${jobId}/time-entries/${entryId}`, {
    method: 'PATCH',
    cookieHeader: customerCookie,
    body: { approved: true },
  });
  assertStatus(approve.status, 200, 'approve entry', approve.payload);

  const customerList = await apiFetch(`/api/jobs/${jobId}/time-entries`, {
    method: 'GET',
    cookieHeader: customerCookie,
  });
  assertStatus(customerList.status, 200, 'customer list entries', customerList.payload);
  const approvedEntry = (customerList.payload?.entries ?? []).find((entry) => entry.id === entryId);
  if (!approvedEntry?.approved) throw new Error('Customer approval state not persisted');

  log('invoice', 'Provider creates invoice');
  const invoice = await apiFetch(`/api/jobs/${jobId}/create-invoice`, {
    method: 'POST',
    cookieHeader: providerACookie,
  });
  assertStatus(invoice.status, 201, 'create invoice', invoice.payload);
  const stripeInvoiceId = invoice.payload?.stripe_invoice_id;
  if (!stripeInvoiceId) throw new Error('stripe_invoice_id missing');

  const { data: jobAfter, error: jobAfterError } = await service
    .from('jobs')
    .select('id,stripe_invoice_id,invoiced_at')
    .eq('id', jobId)
    .maybeSingle();
  if (jobAfterError || !jobAfter) {
    throw new Error(`Job fetch after invoice failed: ${jobAfterError?.message ?? 'not found'}`);
  }
  if (jobAfter.stripe_invoice_id !== stripeInvoiceId) {
    throw new Error(`Job stripe_invoice_id mismatch: expected ${stripeInvoiceId}, got ${jobAfter.stripe_invoice_id}`);
  }

  log('result', 'API-only flow passed');
  console.log(
    JSON.stringify(
      {
        ok: true,
        jobId,
        quoteId,
        entryId,
        stripeInvoiceId,
        users: {
          customer: users.customer.email,
          providerA: users.providerA.email,
          providerB: users.providerB.email,
        },
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error('TIME_TRACKING_API_FLOW_FAIL', error);
  process.exit(1);
});
