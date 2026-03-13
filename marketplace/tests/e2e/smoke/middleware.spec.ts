import {expect, test} from '@playwright/test';

/**
 * Middleware guard tests.
 *
 * These tests verify that middleware.ts is present and functioning correctly.
 * If middleware.ts is accidentally deleted, both tests will fail immediately on CI,
 * preventing a silent regression like the ones seen in sessions 35 and 38.
 */
test.describe('Middleware guards', () => {
  test('root redirects to locale prefix', async ({page}) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en\//);
  });

  test('protected dashboard route redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
