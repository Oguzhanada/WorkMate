import {expect, test} from '@playwright/test';

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe('Admin access smoke', () => {
  test.skip(!email || !password, 'E2E admin credentials are not set');

  test('admin can access admin dashboard', async ({page}) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email as string);
    await page.locator('#login-password').fill(password as string);
    await page.locator('form button[type="submit"]').click();

    await page.goto('/dashboard/admin');
    await expect(page.getByRole('button', {name: 'Pending Job Reviews'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Provider Applications'})).toBeVisible();
  });
});
