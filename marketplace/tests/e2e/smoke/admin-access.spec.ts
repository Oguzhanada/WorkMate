import {expect, test} from '@playwright/test';

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe('Admin access smoke', () => {
  test.skip(!email || !password, 'E2E admin credentials are not set');

  test('admin can access admin dashboard', async ({page}) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email as string);
    await page.getByLabel('Password').fill(password as string);
    await page.getByRole('button', {name: /log in|sign in/i}).click();

    await page.goto('/dashboard/admin');
    await expect(page.getByRole('heading', {name: /Admin Dashboard/i})).toBeVisible();
  });
});
