import {expect, test} from '@playwright/test';

const email = process.env.E2E_CUSTOMER_EMAIL;
const password = process.env.E2E_CUSTOMER_PASSWORD;

test.describe('Customer post job flow', () => {
  test.skip(!email || !password, 'E2E customer credentials are not set');

  test('customer can create a job and sees pending review state', async ({page}) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email as string);
    await page.locator('#login-password').fill(password as string);
    await page.locator('form button[type="submit"]').click();

    await page.goto('/post-job');
    await page.getByRole('heading', {name: 'Create Job Request'}).waitFor();

    await page.getByRole('combobox').first().selectOption({index: 1});
    await page.getByRole('combobox').nth(1).selectOption({index: 1});
    await page.getByRole('combobox').nth(2).selectOption({index: 1});
    await page.getByRole('button', {name: /asap|today|this week/i}).first().click();
    await page.getByRole('button', {name: 'Continue'}).click();

    await page.getByPlaceholder('D02 X285').fill('D02X285');
    await page.getByPlaceholder('D02 X285').blur();
    await page.getByRole('combobox').first().selectOption('Dublin');
    await page.getByRole('combobox').nth(1).selectOption({index: 1});
    await page.getByLabel('Address line 1').fill('1 Main Street');
    await page.getByRole('button', {name: 'Continue'}).click();

    await page.getByRole('button', {name: 'Create Job Request'}).click();
    await expect(page).toHaveURL(/\/post-job\/result\//);
    await expect(page.getByText(/Pending admin approval/i)).toBeVisible();
  });
});
