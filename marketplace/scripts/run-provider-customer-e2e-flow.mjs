import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const suffix = Date.now();
const password = 'WorkMate!Qa2026';
const users = {
  customer: {
    email: `qa.customer.${suffix}@example.com`,
    fullName: `QA Customer ${suffix}`,
  },
  providerA: {
    email: `qa.provider.a.${suffix}@example.com`,
    fullName: `QA Provider A ${suffix}`,
  },
  providerB: {
    email: `qa.provider.b.${suffix}@example.com`,
    fullName: `QA Provider B ${suffix}`,
  },
};

function log(step, message) {
  console.log(`[${step}] ${message}`);
}

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = (data.users ?? []).find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (!data.users || data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureFreshAuthUser({ email, fullName }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existing.id);
    if (deleteError) throw new Error(`deleteUser ${email} failed: ${deleteError.message}`);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, name: fullName },
  });
  if (error) throw new Error(`createUser ${email} failed: ${error.message}`);
  if (!data.user) throw new Error(`createUser ${email} returned empty user`);
  return data.user.id;
}

async function ensureRole(userId, role) {
  const { error } = await supabase.from('user_roles').upsert(
    { user_id: userId, role },
    { onConflict: 'user_id,role' }
  );
  if (error) throw new Error(`role upsert ${role} failed: ${error.message}`);
}

async function setupUsersAndData() {
  log('setup', 'Creating fresh auth users');
  const customerId = await ensureFreshAuthUser(users.customer);
  const providerAId = await ensureFreshAuthUser(users.providerA);
  const providerBId = await ensureFreshAuthUser(users.providerB);

  const { data: categoryRows, error: categoryError } = await supabase
    .from('categories')
    .select('id,name')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(1);
  if (categoryError) throw new Error(`load category failed: ${categoryError.message}`);
  if (!categoryRows || categoryRows.length === 0) {
    const slug = `qa-e2e-${suffix}`;
    const { data: inserted, error: insertCategoryError } = await supabase
      .from('categories')
      .insert({ slug, name: `QA E2E Category ${suffix}`, is_active: true, sort_order: 9999 })
      .select('id,name')
      .single();
    if (insertCategoryError) throw new Error(`insert category failed: ${insertCategoryError.message}`);
    categoryRows = [inserted];
  }
  const categoryId = categoryRows[0].id;

  log('setup', `Using category ${categoryRows[0].name} (${categoryId})`);

  const profilePatches = [
    {
      id: customerId,
      role: 'customer',
      full_name: users.customer.fullName,
      phone: '+353830000001',
      is_verified: false,
      verification_status: 'unverified',
      id_verification_status: 'none',
    },
    {
      id: providerAId,
      role: 'verified_pro',
      full_name: users.providerA.fullName,
      phone: '+353830000002',
      is_verified: true,
      verification_status: 'verified',
      id_verification_status: 'approved',
      provider_matching_priority: 10,
    },
    {
      id: providerBId,
      role: 'verified_pro',
      full_name: users.providerB.fullName,
      phone: '+353830000003',
      is_verified: true,
      verification_status: 'verified',
      id_verification_status: 'approved',
      provider_matching_priority: 2,
    },
  ];

  for (const patch of profilePatches) {
    const { error } = await supabase.from('profiles').upsert(patch, { onConflict: 'id' });
    if (error) throw new Error(`profile upsert failed: ${error.message}`);
  }

  await ensureRole(customerId, 'customer');
  await ensureRole(providerAId, 'customer');
  await ensureRole(providerBId, 'customer');
  await ensureRole(providerAId, 'verified_pro');
  await ensureRole(providerBId, 'verified_pro');

  for (const providerId of [providerAId, providerBId]) {
    const { error: delServicesError } = await supabase.from('pro_services').delete().eq('profile_id', providerId);
    if (delServicesError) throw new Error(`clear pro_services failed: ${delServicesError.message}`);
    const { error: delAreasError } = await supabase.from('pro_service_areas').delete().eq('profile_id', providerId);
    if (delAreasError) throw new Error(`clear pro_service_areas failed: ${delAreasError.message}`);
    const { error: serviceError } = await supabase
      .from('pro_services')
      .insert({ profile_id: providerId, category_id: categoryId });
    if (serviceError) throw new Error(`insert pro_services failed: ${serviceError.message}`);
    const { error: areaError } = await supabase
      .from('pro_service_areas')
      .insert({ profile_id: providerId, county: 'Dublin' });
    if (areaError) throw new Error(`insert pro_service_areas failed: ${areaError.message}`);
    const { error: alertClearError } = await supabase
      .from('task_alerts')
      .delete()
      .eq('provider_id', providerId);
    if (alertClearError) throw new Error(`clear task_alerts failed: ${alertClearError.message}`);
  }

  return { customerId, providerAId, providerBId, categoryId };
}

async function dismissCookieBanner(page) {
  const reject = page.getByRole('button', { name: 'Reject non-essential' });
  if (await reject.isVisible().catch(() => false)) {
    await reject.click();
  }
}

async function login(page, email) {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel('Email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/(profile|dashboard|search|$)/, { timeout: 20000 }).catch(() => null);
  await dismissCookieBanner(page);
}

async function logout(page) {
  await page.goto(`${baseUrl}/profile`);
  const logoutBtn = page.getByRole('button', { name: 'Log out' });
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click();
  }
}

function quotePayload(jobId, amountCents, message) {
  const now = new Date();
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return {
    job_id: jobId,
    quote_amount_cents: amountCents,
    message,
    estimated_duration: '2 hours',
    includes: ['Labour', 'Cleanup'],
    excludes: ['Materials'],
    availability_slots: [{ start: now.toISOString(), end: end.toISOString() }],
  };
}

async function run() {
  const setup = await setupUsersAndData();
  log('setup', `Created users: customer=${users.customer.email}, providerA=${users.providerA.email}, providerB=${users.providerB.email}`);

  const browser = await chromium.launch({ headless: true });
  const providerACtx = await browser.newContext();
  const providerBCtx = await browser.newContext();
  const customerCtx = await browser.newContext();

  const providerAPage = await providerACtx.newPage();
  const providerBPage = await providerBCtx.newPage();
  const customerPage = await customerCtx.newPage();

  try {
    log('task-alerts', 'Provider A login and save alert');
    await login(providerAPage, users.providerA.email);
    await providerAPage.goto(`${baseUrl}/dashboard/pro`);
    await providerAPage.getByText('Job Alerts').waitFor({ timeout: 30000 });
    await providerAPage.getByPlaceholder('e.g. plumbing, boiler, bathroom').fill('boiler, heating');
    await providerAPage.getByPlaceholder('e.g. 200').fill('250');
    await providerAPage.getByLabel('Dublin').check();
    await providerAPage.getByRole('button', { name: 'Save preferences' }).click();
    await providerAPage.getByText('Task alert preferences saved.').waitFor();
    await providerAPage.reload();
    const persistedKeywords = await providerAPage
      .getByPlaceholder('e.g. plumbing, boiler, bathroom')
      .inputValue();
    if (!persistedKeywords.includes('boiler')) {
      throw new Error('Task alert persistence check failed for provider A');
    }

    log('task-alerts', 'Provider B login and verify RLS isolation');
    await login(providerBPage, users.providerB.email);
    await providerBPage.goto(`${baseUrl}/dashboard/pro`);
    const providerBKeywords = await providerBPage
      .getByPlaceholder('e.g. plumbing, boiler, bathroom')
      .inputValue();
    if (providerBKeywords.trim().length !== 0) {
      throw new Error('RLS check failed: provider B can see provider A alert data');
    }

    log('task-alerts', 'Provider A removes alert');
    await providerAPage.goto(`${baseUrl}/dashboard/pro`);
    await providerAPage.getByRole('button', { name: 'Remove alert' }).click();
    await providerAPage.getByText('Task alert removed.').waitFor();
    await logout(providerAPage);
    await logout(providerBPage);

    log('direct-request', 'Customer opens providers and starts direct request');
    await login(customerPage, users.customer.email);
    await customerPage.goto(`${baseUrl}/providers`);
    const providerCard = customerPage.locator('article').filter({
      has: customerPage.getByRole('heading', { name: users.providerA.fullName }),
    }).first();
    await providerCard.getByRole('link', { name: 'Direct Request' }).click();
    await customerPage.waitForURL(/mode=direct_request/);
    const currentUrl = customerPage.url();
    if (!currentUrl.includes(`provider_id=${setup.providerAId}`)) {
      throw new Error('Direct request URL missing expected provider_id');
    }
    await customerPage.getByText('This job will be sent directly to the selected provider.').waitFor();

    log('direct-request', 'Customer submits direct-request job from UI');
    await customerPage.getByRole('combobox').first().selectOption({ index: 1 });
    await customerPage.getByRole('combobox').nth(1).selectOption({ index: 1 });
    await customerPage.getByRole('combobox').nth(2).selectOption({ index: 1 });
    await customerPage.getByRole('button', { name: 'Today' }).click();
    await customerPage.getByRole('button', { name: 'Continue' }).click();
    await customerPage.getByPlaceholder('D02 X285').fill('D02 Y006');
    await customerPage.getByPlaceholder('D02 X285').blur();
    await customerPage.getByRole('combobox').first().selectOption('Dublin');
    await customerPage.getByRole('combobox').nth(1).selectOption({ index: 1 });
    await customerPage.getByLabel('Address line 1').fill('1 Main Street');
    await customerPage.getByRole('button', { name: 'Continue' }).click();
    const createJobResponsePromise = customerPage.waitForResponse(
      (res) => res.url().includes('/api/jobs') && res.request().method() === 'POST',
      { timeout: 20000 }
    );
    await customerPage.getByRole('button', { name: 'Create Job Request' }).click();
    const createJobResponse = await createJobResponsePromise.catch(() => null);
    if (createJobResponse) {
      const text = await createJobResponse.text().catch(() => '');
      log('direct-request', `POST /api/jobs status=${createJobResponse.status()} body=${text.slice(0, 300)}`);
    } else {
      log('direct-request', 'POST /api/jobs response was not captured');
    }
    const redirectedToResult = await customerPage
      .waitForURL(/\/post-job\/result\//, { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    if (!redirectedToResult) {
      const hints = (await customerPage.locator('p').allTextContents())
        .filter((line) => /error|failed|please|could not|required|validation|category|eircode/i.test(line))
        .slice(0, 8)
        .join(' | ');
      throw new Error(`Direct request submit did not redirect. URL=${customerPage.url()} Hints=${hints}`);
    }

    const directJobId = customerPage.url().split('/').pop();
    if (!directJobId) throw new Error('Direct request job id could not be parsed');
    log('direct-request', `Direct job created: ${directJobId}`);

    const { error: approveDirectError } = await supabase
      .from('jobs')
      .update({ review_status: 'approved', status: 'open' })
      .eq('id', directJobId);
    if (approveDirectError) throw new Error(`Direct job approval failed: ${approveDirectError.message}`);

    log('direct-request', 'Provider A quote should succeed; provider B should be blocked with 403');
    await login(providerAPage, users.providerA.email);
    const quoteOk = await providerAPage.request.post(`${baseUrl}/api/quotes`, {
      data: quotePayload(directJobId, 12000, 'Direct request quote from provider A'),
    });
    if (quoteOk.status() !== 201) {
      throw new Error(`Provider A quote expected 201, got ${quoteOk.status()}`);
    }

    await login(providerBPage, users.providerB.email);
    const quoteBlocked = await providerBPage.request.post(`${baseUrl}/api/quotes`, {
      data: quotePayload(directJobId, 11000, 'Should fail due to direct request guard'),
    });
    if (quoteBlocked.status() !== 403) {
      throw new Error(`Provider B quote expected 403, got ${quoteBlocked.status()}`);
    }
    await logout(providerAPage);
    await logout(providerBPage);

    log('ranking', 'Create a get_quotes job and submit two quotes with different prices');
    await customerPage.goto(`${baseUrl}/dashboard/customer`);
    const rankingJobTitle = `QA Ranking Job ${suffix}`;
    const createRankingJobRes = await customerPage.request.post(`${baseUrl}/api/jobs`, {
      data: {
        title: rankingJobTitle,
        category_id: setup.categoryId,
        description: 'Need a reliable provider for ranking score verification.',
        eircode: 'D02Y006',
        county: 'Dublin',
        locality: 'Dublin',
        budget_range: '€200-€500',
        job_mode: 'get_quotes',
        task_type: 'in_person',
        target_provider_id: null,
        photo_urls: [],
      },
    });
    if (createRankingJobRes.status() !== 201) {
      throw new Error(`Create ranking job expected 201, got ${createRankingJobRes.status()}`);
    }
    const rankingPayload = await createRankingJobRes.json();
    const rankingJobId = rankingPayload?.job?.id;
    if (!rankingJobId) throw new Error('Ranking job id missing in API response');

    const { error: approveRankingError } = await supabase
      .from('jobs')
      .update({ review_status: 'approved', status: 'open' })
      .eq('id', rankingJobId);
    if (approveRankingError) throw new Error(`Ranking job approval failed: ${approveRankingError.message}`);

    await login(providerAPage, users.providerA.email);
    const q1 = await providerAPage.request.post(`${baseUrl}/api/quotes`, {
      data: quotePayload(rankingJobId, 9000, 'Competitive quote from provider A'),
    });
    if (q1.status() !== 201) throw new Error(`Provider A ranking quote expected 201, got ${q1.status()}`);
    await logout(providerAPage);

    await login(providerBPage, users.providerB.email);
    const q2 = await providerBPage.request.post(`${baseUrl}/api/quotes`, {
      data: quotePayload(rankingJobId, 30000, 'Higher quote from provider B'),
    });
    if (q2.status() !== 201) throw new Error(`Provider B ranking quote expected 201, got ${q2.status()}`);
    await logout(providerBPage);

    log('ranking', 'Verify TOP OFFER badge and quote order on customer dashboard');
    await customerPage.goto(`${baseUrl}/dashboard/customer`);
    const rankingCard = customerPage.locator('article').filter({
      has: customerPage.getByRole('heading', { name: rankingJobTitle }),
    }).first();
    await rankingCard.getByText('TOP OFFER').waitFor();
    const firstQuotedProvider = (await rankingCard.locator('p > strong').first().textContent()) ?? '';
    if (!firstQuotedProvider.includes(users.providerA.fullName)) {
      throw new Error(`Expected first quote provider to be ${users.providerA.fullName}, got ${firstQuotedProvider}`);
    }
    await logout(customerPage);

    log('result', 'All end-to-end flow checks passed');
    console.log(
      JSON.stringify(
        {
          ok: true,
          createdUsers: {
            customer: users.customer.email,
            providerA: users.providerA.email,
            providerB: users.providerB.email,
          },
          ids: {
            customerId: setup.customerId,
            providerAId: setup.providerAId,
            providerBId: setup.providerBId,
          },
          directRequestJobId: directJobId,
          rankingJobId,
        },
        null,
        2
      )
    );
  } finally {
    await providerAPage.close();
    await providerBPage.close();
    await customerPage.close();
    await providerACtx.close();
    await providerBCtx.close();
    await customerCtx.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error('E2E_FLOW_FAIL', error);
  process.exit(1);
});
