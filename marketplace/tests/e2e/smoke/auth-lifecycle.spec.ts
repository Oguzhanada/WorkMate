import {expect, test} from '@playwright/test';

const email = process.env.E2E_CUSTOMER_EMAIL;
const password = process.env.E2E_CUSTOMER_PASSWORD;

test.describe('Auth lifecycle', () => {
  test.skip(!email || !password, 'E2E credentials are not set');

  test('user can log in, open profile, and log out', async ({page}) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email as string);
    await page.locator('#login-password').fill(password as string);
    await page.locator('form button[type="submit"]').click();

    const rejectCookies = page.getByRole('button', {name: 'Reject non-essential'});
    if (await rejectCookies.isVisible().catch(() => false)) {
      await rejectCookies.click();
    }

    await expect(page.getByRole('link', {name: 'Profile'})).toBeVisible();
    await page.getByRole('link', {name: 'Profile'}).click();
    await expect(page).toHaveURL(/\/profile/);

    await page.getByRole('button', {name: 'Log out'}).click();
    await expect(page.getByRole('link', {name: 'Log in'})).toBeVisible();
  });
});
