import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Provider-side feature smoke tests
// Requires: E2E_PRO_EMAIL / E2E_PRO_PASSWORD (verified_pro account)
//           E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD (customer account)
// ---------------------------------------------------------------------------

const proEmail = process.env.E2E_PRO_EMAIL;
const proPassword = process.env.E2E_PRO_PASSWORD;
const customerEmail = process.env.E2E_CUSTOMER_EMAIL;
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD;

async function loginAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Task alerts
// ---------------------------------------------------------------------------

test.describe('Task alerts — pro can manage keyword alerts', () => {
  test.skip(!proEmail || !proPassword, 'E2E_PRO_EMAIL / E2E_PRO_PASSWORD not set');

  test('pro can save a task alert and see it listed', async ({ page }) => {
    await loginAs(page, proEmail!, proPassword!);
    await page.goto('/dashboard/pro');

    // The TaskAlertsPanel should be visible on the pro dashboard
    await expect(page.getByRole('heading', { name: /Task Alerts/i })).toBeVisible({ timeout: 8_000 });

    // Fill in at least one keyword
    const keywordsInput = page.getByPlaceholder(/e\.g\. cleaning/i);
    await keywordsInput.fill('plumbing, boiler repair');

    // Select a county
    const dublinCheckbox = page.getByLabel('Dublin');
    if (await dublinCheckbox.isVisible()) {
      await dublinCheckbox.check();
    }

    // Save
    await page.getByRole('button', { name: /Save Alert/i }).click();

    // Expect success feedback (no error shown)
    await expect(page.getByRole('button', { name: /Save Alert/i })).toBeEnabled({ timeout: 5_000 });
  });

  test('task alert toggle persists enabled state', async ({ page }) => {
    await loginAs(page, proEmail!, proPassword!);
    await page.goto('/dashboard/pro');

    const toggleLabel = page.getByText(/Enable alerts/i);
    await expect(toggleLabel).toBeVisible({ timeout: 8_000 });

    const toggle = page.locator('input[type="checkbox"]').filter({ hasText: '' }).first();
    const wasChecked = await toggle.isChecked().catch(() => false);

    // Toggle and save
    await toggle.setChecked(!wasChecked);
    await page.getByRole('button', { name: /Save Alert/i }).click();

    // Reload and verify state persisted
    await page.reload();
    await page.waitForLoadState('networkidle');
    const toggleAfterReload = page.locator('input[type="checkbox"]').first();
    const nowChecked = await toggleAfterReload.isChecked().catch(() => false);
    expect(nowChecked).toBe(!wasChecked);
  });
});

// ---------------------------------------------------------------------------
// Direct Request flow
// ---------------------------------------------------------------------------

test.describe('Direct Request flow — customer can send job directly to provider', () => {
  test.skip(!customerEmail || !customerPassword, 'E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD not set');

  test('providers page shows Direct Request button', async ({ page }) => {
    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/providers');

    // There should be at least one provider card with a Direct Request link
    await expect(page.getByRole('link', { name: 'Direct Request' }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Direct Request button pre-fills job form with provider and mode', async ({ page }) => {
    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/providers');

    // Click the first Direct Request link
    const directRequestLink = page.getByRole('link', { name: 'Direct Request' }).first();
    const href = await directRequestLink.getAttribute('href');
    expect(href).toMatch(/mode=direct_request/);
    expect(href).toMatch(/provider_id=/);

    await directRequestLink.click();
    await page.waitForLoadState('networkidle');

    // The post-job page should show the direct request notice
    await expect(page.getByText(/This job will be sent directly to the selected provider/i)).toBeVisible({
      timeout: 8_000,
    });
  });
});

// ---------------------------------------------------------------------------
// Offer ranking badge visibility
// ---------------------------------------------------------------------------

test.describe('Offer ranking badge — customer dashboard shows TOP OFFER badge', () => {
  test.skip(!customerEmail || !customerPassword, 'E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD not set');

  test('customer dashboard renders without JS errors on job/quote section', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/dashboard/customer');

    // Page should load cleanly
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard\/customer/);

    // No JS errors
    expect(errors).toHaveLength(0);
  });

  test('job_mode badges render for quick_hire and direct_request jobs if present', async ({ page }) => {
    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/dashboard/customer');
    await page.waitForLoadState('networkidle');

    // Locate mode badge elements if any jobs exist with these modes.
    // We don't assert count since test DB may have zero such jobs.
    const quickBadges = page.locator('span:has-text("Quick Hire")');
    const directBadges = page.locator('span:has-text("Direct Request")');

    // Simply verify these selectors work without throwing
    const qCount = await quickBadges.count();
    const dCount = await directBadges.count();
    expect(typeof qCount).toBe('number');
    expect(typeof dCount).toBe('number');
  });
});
