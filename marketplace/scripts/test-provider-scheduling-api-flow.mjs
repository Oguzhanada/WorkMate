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
  customer: { email: `qa.sch.customer.${suffix}@example.com`, fullName: `QA Scheduler Customer ${suffix}` },
  providerA: { email: `qa.sch.provider.a.${suffix}@example.com`, fullName: `QA Scheduler Provider A ${suffix}` },
  providerB: { email: `qa.sch.provider.b.${suffix}@example.com`, fullName: `QA Scheduler Provider B ${suffix}` },
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

function nextMondayAt(hour, minute = 0) {
  const now = new Date();
  const day = now.getUTCDay();
  const distance = (8 - day) % 7 || 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + distance, hour, minute, 0, 0));
  return monday;
}

async function run() {
  const { error: tableErrorA } = await service.from('provider_availability').select('id').limit(1);
  const { error: tableErrorB } = await service.from('appointments').select('id').limit(1);
  if (tableErrorA) throw new Error(`provider_availability table is not accessible: ${tableErrorA.message}`);
  if (tableErrorB) throw new Error(`appointments table is not accessible: ${tableErrorB.message}`);

  log('setup', 'Creating users');
  const customerId = await ensureFreshAuthUser(users.customer);
  const providerAId = await ensureFreshAuthUser(users.providerA);
  const providerBId = await ensureFreshAuthUser(users.providerB);

  for (const profile of [
    {
      id: customerId,
      role: 'customer',
      full_name: users.customer.fullName,
      phone: '+353830200001',
      is_verified: false,
      verification_status: 'unverified',
      id_verification_status: 'none',
    },
    {
      id: providerAId,
      role: 'verified_pro',
      full_name: users.providerA.fullName,
      phone: '+353830200002',
      is_verified: true,
      verification_status: 'verified',
      id_verification_status: 'approved',
    },
    {
      id: providerBId,
      role: 'verified_pro',
      full_name: users.providerB.fullName,
      phone: '+353830200003',
      is_verified: true,
      verification_status: 'verified',
      id_verification_status: 'approved',
    },
  ]) {
    const { error } = await service.from('profiles').upsert(profile, { onConflict: 'id' });
    if (error) throw new Error(`profile upsert failed: ${error.message}`);
  }

  await ensureRole(customerId, 'customer');
  await ensureRole(providerAId, 'verified_pro');
  await ensureRole(providerBId, 'verified_pro');

  const { data: categories, error: categoryError } = await service
    .from('categories')
    .select('id')
    .eq('is_active', true)
    .limit(1);
  if (categoryError || !categories || categories.length === 0) {
    throw new Error(`Cannot resolve active category: ${categoryError?.message ?? 'none found'}`);
  }

  const categoryId = categories[0].id;

  const customerCookie = await buildAuthedCookieHeader(users.customer.email);
  const providerACookie = await buildAuthedCookieHeader(users.providerA.email);
  const providerBCookie = await buildAuthedCookieHeader(users.providerB.email);

  log('jobs', 'Creating job and assigning provider A');
  const jobCreate = await apiFetch('/api/jobs', {
    method: 'POST',
    cookieHeader: customerCookie,
    body: {
      title: `QA Scheduler ${suffix}`,
      category_id: categoryId,
      description: 'Appointment scheduling smoke flow',
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

  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  const quoteCreate = await apiFetch('/api/quotes', {
    method: 'POST',
    cookieHeader: providerACookie,
    body: {
      job_id: jobId,
      quote_amount_cents: 8000,
      message: 'Quote for scheduler smoke',
      estimated_duration: '2 hours',
      includes: ['Labour'],
      excludes: [],
      availability_slots: [{ start: now.toISOString(), end: later.toISOString() }],
    },
  });
  assertStatus(quoteCreate.status, 201, 'create quote', quoteCreate.payload);

  const quoteId = quoteCreate.payload?.quote?.id;
  if (!quoteId) throw new Error('Quote id missing');

  const accept = await apiFetch(`/api/jobs/${jobId}/accept-quote`, {
    method: 'PATCH',
    cookieHeader: customerCookie,
    body: { quote_id: quoteId },
  });
  assertStatus(accept.status, 200, 'accept quote', accept.payload);

  log('availability', 'Provider adds Monday 09:00-17:00 recurring availability');
  const addAvailability = await apiFetch(`/api/providers/${providerAId}/availability`, {
    method: 'POST',
    cookieHeader: providerACookie,
    body: {
      is_recurring: true,
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
    },
  });
  assertStatus(addAvailability.status, 201, 'add availability', addAvailability.payload);

  const mondayStart = nextMondayAt(10, 0);
  const mondayEnd = nextMondayAt(11, 0);

  log('appointments', 'Customer books appointment for assigned provider');
  const createAppointment = await apiFetch(`/api/jobs/${jobId}/appointments`, {
    method: 'POST',
    cookieHeader: customerCookie,
    body: {
      start_time: mondayStart.toISOString(),
      end_time: mondayEnd.toISOString(),
    },
  });
  assertStatus(createAppointment.status, 201, 'create appointment', createAppointment.payload);
  const appointmentId = createAppointment.payload?.appointment?.id;
  if (!appointmentId) throw new Error('Appointment id missing');

  log('appointments', 'Conflicting appointment must be blocked');
  const conflict = await apiFetch(`/api/jobs/${jobId}/appointments`, {
    method: 'POST',
    cookieHeader: customerCookie,
    body: {
      start_time: nextMondayAt(10, 30).toISOString(),
      end_time: nextMondayAt(11, 30).toISOString(),
    },
  });
  if (![400, 409].includes(conflict.status)) {
    throw new Error(`conflict create expected 400/409, got ${conflict.status}. Payload=${JSON.stringify(conflict.payload)}`);
  }

  log('appointments', 'Unrelated provider cannot view appointments');
  const blockedRead = await apiFetch(`/api/jobs/${jobId}/appointments`, {
    method: 'GET',
    cookieHeader: providerBCookie,
  });
  if (![403, 404].includes(blockedRead.status)) {
    throw new Error(`provider B read expected 403/404, got ${blockedRead.status}. Payload=${JSON.stringify(blockedRead.payload)}`);
  }

  log('appointments', 'Customer cancels appointment');
  const cancel = await apiFetch(`/api/appointments/${appointmentId}`, {
    method: 'PATCH',
    cookieHeader: customerCookie,
    body: { status: 'cancelled' },
  });
  assertStatus(cancel.status, 200, 'cancel appointment', cancel.payload);

  console.log(
    JSON.stringify(
      {
        ok: true,
        jobId,
        quoteId,
        appointmentId,
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
  console.error('PROVIDER_SCHEDULING_API_FLOW_FAIL', error);
  process.exit(1);
});
