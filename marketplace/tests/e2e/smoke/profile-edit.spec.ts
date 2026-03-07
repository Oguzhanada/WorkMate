import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Profile editing smoke tests.
// Requires: E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD
// ---------------------------------------------------------------------------

const email = process.env.E2E_CUSTOMER_EMAIL;
const password = process.env.E2E_CUSTOMER_PASSWORD;

async function loginAs(
  page: import('@playwright/test').Page,
  userEmail: string,
  userPassword: string
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(userEmail);
  await page.locator('#login-password').fill(userPassword);
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible({ timeout: 10_000 });
}

test.describe('Profile page — structure', () => {
  test.skip(!email || !password, 'E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD not set');

  test('profile page loads after login', async ({ page }) => {
    await loginAs(page, email!, password!);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
  });

  test('profile page contains key editable fields', async ({ page }) => {
    await loginAs(page, email!, password!);
    await page.goto('/profile');

    // Full name / display name input
    const nameInput = page
      .getByLabel(/full name|display name|name/i)
      .first();
    await expect(nameInput).toBeVisible({ timeout: 8_000 });
  });

  test('profile page has a save / update button', async ({ page }) => {
    await loginAs(page, email!, password!);
    await page.goto('/profile');

    const saveBtn = page.getByRole('button', { name: /save|update|apply/i });
    await expect(saveBtn.first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Profile page — editing full name', () => {
  test.skip(!email || !password, 'E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD not set');

  test('user can update their full name and receive confirmation', async ({ page }) => {
    await loginAs(page, email!, password!);
    await page.goto('/profile');

    const nameInput = page.getByLabel(/full name|display name|name/i).first();
    await nameInput.waitFor({ timeout: 8_000 });

    const original = await nameInput.inputValue();
    const updated = original.endsWith('_t') ? original.slice(0, -2) : `${original}_t`;

    await nameInput.fill(updated);
    await page.getByRole('button', { name: /save|update|apply/i }).first().click();

    // Expect success feedback: a toast, alert, or confirmation text
    const successLocator = page.locator(
      '[role="alert"], .text-green-600, .text-green-500, p:has-text("saved"), p:has-text("updated")'
    );
    await expect(successLocator.first()).toBeVisible({ timeout: 8_000 });

    // Restore original value
    await nameInput.fill(original);
    await page.getByRole('button', { name: /save|update|apply/i }).first().click();
  });
});

test.describe('Profile page — phone number validation', () => {
  test.skip(!email || !password, 'E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD not set');

  test('rejects a non-Irish phone number format', async ({ page }) => {
    await loginAs(page, email!, password!);
    await page.goto('/profile');

    const phoneInput = page.getByLabel(/phone/i).first();
    if (!(await phoneInput.isVisible().catch(() => false))) {
      test.skip(true, 'Phone field not visible on profile page');
      return;
    }

    await phoneInput.fill('+1-800-555-1234'); // non-Irish number
    await page.getByRole('button', { name: /save|update|apply/i }).first().click();

    const errorLocator = page.locator('[role="alert"], .text-red-600, .text-red-500');
    await expect(errorLocator.first()).toBeVisible({ timeout: 6_000 });
  });
});

test.describe('Profile page — unauthenticated redirect', () => {
  test('guest is redirected away from /profile', async ({ page }) => {
    await page.goto('/profile');
    // Should end up at login or home — not on /profile
    await expect(page).not.toHaveURL(/\/profile$/);
  });
});
