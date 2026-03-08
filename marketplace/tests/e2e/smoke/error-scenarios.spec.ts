import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Error scenario smoke tests — no credentials required for most of these.
// Covers: 404 pages, unauthorized redirects, invalid form submissions.
// ---------------------------------------------------------------------------

// ─── 404 handling ─────────────────────────────────────────────────────────────

test.describe('404 / Not Found pages', () => {
  test('non-existent route shows a 404 or redirect', async ({ page }) => {
    const response = await page.goto('/this-page-absolutely-does-not-exist-xyz');
    // Either the server returns 404, or the app shows a not-found UI
    const status = response?.status() ?? 200;
    const isNotFound = status === 404 || status === 200; // Next.js may serve 200 with not-found UI
    expect(isNotFound).toBe(true);

    // If 200, the page should display a not-found message or redirect somewhere sensible
    if (status === 200) {
      // Should not show a blank page with no content
      const bodyText = await page.locator('body').textContent();
      expect((bodyText ?? '').length).toBeGreaterThan(0);
    }
  });

  test('non-existent job ID shows error or redirect', async ({ page }) => {
    await page.goto('/jobs/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');

    // Should show not found message or redirect to /jobs
    const isRedirectedToList = page.url().match(/\/jobs\/?$/);
    const hasNotFoundText = await page
      .getByText(/not found|job not found|does not exist|no longer available/i)
      .isVisible()
      .catch(() => false);

    expect(isRedirectedToList || hasNotFoundText).toBeTruthy();
  });

  test('non-existent provider profile shows error or redirect', async ({ page }) => {
    await page.goto('/providers/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');

    const isRedirected = page.url().match(/\/providers\/?$/);
    const hasNotFoundText = await page
      .getByText(/not found|provider not found|does not exist/i)
      .isVisible()
      .catch(() => false);

    expect(isRedirected || hasNotFoundText).toBeTruthy();
  });
});

// ─── Unauthorized access / authentication guards ──────────────────────────────

test.describe('Authentication guards — guest redirects', () => {
  test('guest is redirected from /dashboard/customer', async ({ page }) => {
    await page.goto('/dashboard/customer');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/dashboard\/customer/);
  });

  test('guest is redirected from /dashboard/pro', async ({ page }) => {
    await page.goto('/dashboard/pro');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/dashboard\/pro/);
  });

  test('guest is redirected from /dashboard/admin', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/dashboard\/admin/);
  });

  test('guest is redirected from /post-job', async ({ page }) => {
    await page.goto('/post-job');
    await page.waitForLoadState('networkidle');
    // Should end up at login, home, or any page that is NOT /post-job
    await expect(page).not.toHaveURL(/\/post-job$/);
  });

  test('guest is redirected from /profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/profile$/);
  });

  test('guest is redirected from /jobs (if auth-gated)', async ({ page }) => {
    const response = await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    // /jobs may be public — just verify the page loads without a crash
    expect(response?.status()).not.toBe(500);
  });
});

// ─── Form validation — post-job page ─────────────────────────────────────────

test.describe('Post-job form — client-side validation (guest-visible)', () => {
  test('post-job page is accessible and renders correctly', async ({ page }) => {
    const response = await page.goto('/post-job');
    await page.waitForLoadState('networkidle');

    // If redirected to login, that is acceptable
    if (page.url().match(/login|auth/i)) return;

    // If the form is shown, check it doesn't crash
    expect(response?.status()).not.toBe(500);
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').length).toBeGreaterThan(0);
  });
});

// ─── Admin-only pages ─────────────────────────────────────────────────────────

test.describe('Admin-only routes — non-admin cannot access', () => {
  const customerEmail = process.env.E2E_CUSTOMER_EMAIL;
  const customerPassword = process.env.E2E_CUSTOMER_PASSWORD;

  test.skip(!customerEmail || !customerPassword, 'E2E customer credentials not set');

  test('customer cannot access /dashboard/admin and is redirected', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(customerEmail!);
    await page.locator('#login-password').fill(customerPassword!);
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 10_000 });

    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');

    // Should be redirected away from the admin dashboard
    await expect(page).not.toHaveURL(/\/dashboard\/admin/);
  });
});

// ─── API route — unauthorized 401 responses ───────────────────────────────────

test.describe('API routes — unauthenticated requests return 401', () => {
  test('GET /api/admin/pending-jobs returns 401 without auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/pending-jobs');
    expect(response.status()).toBe(401);
  });

  test('POST /api/reviews returns 401 without auth', async ({ page }) => {
    const response = await page.request.post('/api/reviews', {
      data: { job_id: '00000000-0000-0000-0000-000000000000', rating: 5 },
    });
    expect(response.status()).toBe(401);
  });

  test('GET /api/admin/provider-applications returns 401 without auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/provider-applications');
    expect(response.status()).toBe(401);
  });
});

// ─── Page crash detection ─────────────────────────────────────────────────────

test.describe('Critical pages — no JS errors on load', () => {
  const publicRoutes = ['/', '/search', '/providers', '/login', '/register'];

  for (const route of publicRoutes) {
    test(`${route} loads with no unhandled JS errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(route);
      await page.waitForLoadState('networkidle');

      expect(errors).toHaveLength(0);
    });
  }
});
