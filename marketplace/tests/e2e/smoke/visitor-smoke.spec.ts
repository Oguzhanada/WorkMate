import {expect, test} from '@playwright/test';

test.describe('Visitor smoke flows', () => {
  test('home renders and can navigate to search', async ({page}) => {
    await page.goto('/');
    await expect(page.getByRole('heading', {name: /Ireland's Trusted Marketplace/i})).toBeVisible();

    const keyword = page.getByPlaceholder('What service do you need?');
    await keyword.fill('cleaning');
    await keyword.press('Enter');

    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByRole('heading', {name: 'Search results'})).toBeVisible();
  });

  test('guest sees login and sign up links', async ({page}) => {
    await page.goto('/');
    await expect(page.getByRole('link', {name: 'Log in'})).toBeVisible();
    await expect(page.getByRole('link', {name: 'Sign up'})).toBeVisible();
  });
});
