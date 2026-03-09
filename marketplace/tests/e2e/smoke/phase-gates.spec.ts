import { expect, test } from '@playwright/test';

const customerEmail = process.env.E2E_CUSTOMER_EMAIL;
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD;
const proEmail = process.env.E2E_PRO_EMAIL;
const proPassword = process.env.E2E_PRO_PASSWORD;

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
}

test.describe('Phase A gate - provider funnel', () => {
  test.skip(!proEmail || !proPassword, 'E2E provider credentials not set');

  test('provider can reach jobs discovery and open at least one detail page when available', async ({ page }) => {
    await login(page, proEmail!, proPassword!);
    await page.goto('/jobs');
    await expect(page).toHaveURL(/\/jobs/);

    const firstJobLink = page.getByRole('link', { name: /view|details|open/i }).first();
    if (await firstJobLink.isVisible().catch(() => false)) {
      await firstJobLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/jobs\//);
    }
  });
});

test.describe('Phase B gate - trust and dispute', () => {
  test.skip(!customerEmail || !customerPassword, 'E2E customer credentials not set');

  test('customer can open disputes dashboard page', async ({ page }) => {
    await login(page, customerEmail!, customerPassword!);
    await page.goto('/dashboard/disputes');
    await expect(page).toHaveURL(/\/dashboard\/disputes/);
  });

  test('dispute list page loads with either items or empty state text', async ({ page }) => {
    await login(page, customerEmail!, customerPassword!);
    await page.goto('/dashboard/disputes');
    await page.waitForLoadState('networkidle');

    const hasDisputeCard = await page.locator('[data-testid="dispute-card"], article').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no disputes|track dispute status/i).first().isVisible().catch(() => false);
    expect(hasDisputeCard || hasEmptyState).toBe(true);
  });
});

test.describe('Phase C gate - ops reliability', () => {
  test('guest cannot access admin incident surfaces', async ({ page }) => {
    const response = await page.request.get('/api/admin/provider-applications');
    expect(response.status()).toBe(401);
  });

  test('stripe webhook endpoint rejects unsigned event payloads', async ({ page }) => {
    const response = await page.request.post('/api/webhooks/stripe', {
      data: { type: 'charge.dispute.created' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
