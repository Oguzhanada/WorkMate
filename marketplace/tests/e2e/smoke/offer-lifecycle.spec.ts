import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Offer lifecycle smoke tests.
// Tests the quote/offer flow from both customer and pro perspectives.
// Requires:
//   E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD
//   E2E_PRO_EMAIL      / E2E_PRO_PASSWORD
// ---------------------------------------------------------------------------

const customerEmail = process.env.E2E_CUSTOMER_EMAIL;
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD;
const proEmail = process.env.E2E_PRO_EMAIL;
const proPassword = process.env.E2E_PRO_PASSWORD;

async function loginAs(
  page: import('@playwright/test').Page,
  userEmail: string,
  userPassword: string,
  waitForNav = true
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(userEmail);
  await page.locator('#login-password').fill(userPassword);
  await page.locator('form button[type="submit"]').click();
  if (waitForNav) {
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 10_000 });
  }
}

// ─── Customer side ────────────────────────────────────────────────────────────

test.describe('Customer — offer/quote panel visibility', () => {
  test.skip(!customerEmail || !customerPassword, 'E2E customer credentials not set');

  test('customer dashboard loads cleanly with no JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/dashboard/customer');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
    await expect(page).toHaveURL(/\/dashboard\/customer/);
  });

  test('customer can navigate to their jobs list', async ({ page }) => {
    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/jobs/);
  });

  test('job detail page renders without error for a customer job', async ({ page }) => {
    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    // If there are any job links, follow the first one
    const firstJobLink = page.getByRole('link', { name: /view|details|open/i }).first();
    if (await firstJobLink.isVisible().catch(() => false)) {
      await firstJobLink.click();
      await page.waitForLoadState('networkidle');
      // Should be on a job detail page
      await expect(page).toHaveURL(/\/jobs\//);
    }
  });

  test('customer sees "No offers yet" or offer list on job detail', async ({ page }) => {
    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    const firstJobLink = page.getByRole('link', { name: /view|details|open/i }).first();
    if (!(await firstJobLink.isVisible().catch(() => false))) {
      test.skip(true, 'No jobs available in test account');
      return;
    }

    await firstJobLink.click();
    await page.waitForLoadState('networkidle');

    // Either offers are listed, or the empty state is shown
    const hasOffers = await page
      .locator('[data-testid="offer-card"], .offer-card')
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/no offers|no quotes|be the first/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasOffers || hasEmpty).toBe(true);
  });
});

// ─── Pro side ─────────────────────────────────────────────────────────────────

test.describe('Pro — submitting an offer', () => {
  test.skip(!proEmail || !proPassword, 'E2E pro credentials not set');

  test('pro dashboard loads cleanly with no JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginAs(page, proEmail!, proPassword!);
    await page.goto('/dashboard/pro');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
    await expect(page).toHaveURL(/\/dashboard\/pro/);
  });

  test('pro can see available jobs list', async ({ page }) => {
    await loginAs(page, proEmail!, proPassword!);
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/jobs/);
  });

  test('pro sees a "Submit offer" / "Quote" button on open job details', async ({ page }) => {
    await loginAs(page, proEmail!, proPassword!);
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    // Try to find any open job link
    const firstJobLink = page.getByRole('link', { name: /view|details|open/i }).first();
    if (!(await firstJobLink.isVisible().catch(() => false))) {
      test.skip(true, 'No open jobs found in test account');
      return;
    }

    await firstJobLink.click();
    await page.waitForLoadState('networkidle');

    const quoteBtn = page.getByRole('button', { name: /submit offer|submit quote|quote this job/i });
    const hasQuoteBtn = await quoteBtn.isVisible().catch(() => false);

    const alreadyQuoted = await page
      .getByText(/you have already submitted|offer submitted/i)
      .isVisible()
      .catch(() => false);

    // Either the quote button is there, or the pro already submitted one
    expect(hasQuoteBtn || alreadyQuoted).toBe(true);
  });
});

// ─── Offer accept/reject (customer flow) ─────────────────────────────────────

test.describe('Customer — accept or reject an offer', () => {
  test.skip(!customerEmail || !customerPassword, 'E2E customer credentials not set');

  test('accept button is present on a job with at least one offer', async ({ page }) => {
    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    const firstJobLink = page.getByRole('link', { name: /view|details|open/i }).first();
    if (!(await firstJobLink.isVisible().catch(() => false))) {
      test.skip(true, 'No jobs available in test account');
      return;
    }

    await firstJobLink.click();
    await page.waitForLoadState('networkidle');

    const acceptBtn = page.getByRole('button', { name: /accept|hire/i }).first();
    const hasAccept = await acceptBtn.isVisible().catch(() => false);

    // Acceptable: either accept button exists, or the job is already accepted/completed
    const alreadyAccepted = await page
      .getByText(/accepted|in progress|completed/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasAccept || alreadyAccepted).toBe(true);
  });
});

// ─── Messaging panel ─────────────────────────────────────────────────────────

test.describe('Job messaging panel', () => {
  test.skip(!customerEmail || !customerPassword, 'E2E customer credentials not set');

  test('messages section is visible on a job detail page', async ({ page }) => {
    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    const firstJobLink = page.getByRole('link', { name: /view|details|open/i }).first();
    if (!(await firstJobLink.isVisible().catch(() => false))) {
      test.skip(true, 'No jobs available in test account');
      return;
    }

    await firstJobLink.click();
    await page.waitForLoadState('networkidle');

    // Look for a message textarea or messages heading
    const hasMessageInput = await page
      .locator('textarea[placeholder*="message" i], textarea[placeholder*="write" i]')
      .first()
      .isVisible()
      .catch(() => false);

    const hasMessagesHeading = await page
      .getByRole('heading', { name: /messages|chat|comments/i })
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasMessageInput || hasMessagesHeading).toBe(true);
  });

  test('sending an empty message does not submit', async ({ page }) => {
    await loginAs(page, customerEmail!, customerPassword!);
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    const firstJobLink = page.getByRole('link', { name: /view|details|open/i }).first();
    if (!(await firstJobLink.isVisible().catch(() => false))) {
      test.skip(true, 'No jobs in test account');
      return;
    }

    await firstJobLink.click();
    await page.waitForLoadState('networkidle');

    const sendBtn = page.getByRole('button', { name: /send/i }).first();
    if (!(await sendBtn.isVisible().catch(() => false))) {
      test.skip(true, 'No send button on this job');
      return;
    }

    // Leave the message textarea empty and click send
    await sendBtn.click();

    // Page should not navigate away
    await expect(page).toHaveURL(/\/jobs\//);
  });
});
