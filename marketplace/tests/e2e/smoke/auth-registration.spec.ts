import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Registration page — UI + client-side form validation smoke tests.
// These tests do NOT create real accounts (no credentials required).
// ---------------------------------------------------------------------------

test.describe('Registration page — structure and validation', () => {
  test('sign-up page renders required fields', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up|create account|register/i })).toBeVisible();
  });

  test('shows a link back to the login page', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.getByRole('link', { name: /log in|sign in/i });
    await expect(loginLink).toBeVisible();
  });

  test('sign-up form is reachable from the home page via Sign up link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/register|sign-?up/i);
  });

  test('shows an error when submitting an empty form', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /sign up|create account|register/i }).click();

    // Either HTML5 validation or custom error message should appear
    const emailInput = page.getByLabel(/email/i);
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    const hasHtml5Error = validationMessage.length > 0;

    const hasCustomError = await page
      .locator('[role="alert"], .text-red-600, .text-red-500')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasHtml5Error || hasCustomError).toBe(true);
  });

  test('shows an error for an invalid email format', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/email/i).fill('notanemail');

    const passwordInput = page.getByLabel(/password/i).first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('SomePassword1!');
    }

    await page.getByRole('button', { name: /sign up|create account|register/i }).click();

    const emailInput = page.getByLabel(/email/i);
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    const hasHtml5Error = validationMessage.length > 0;

    const hasCustomError = await page
      .locator('[role="alert"], .text-red-600, .text-red-500')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasHtml5Error || hasCustomError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Login page — structure and validation smoke tests.
// ---------------------------------------------------------------------------

test.describe('Login page — structure and validation', () => {
  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });

  test('shows a link to the registration page', async ({ page }) => {
    await page.goto('/login');
    const signupLink = page.getByRole('link', { name: /sign up|create account|register/i });
    await expect(signupLink).toBeVisible();
  });

  test('shows an error for wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('nonexistent@workmate.ie');
    await page.locator('#login-password').fill('WrongPassword123!');
    await page.locator('form button[type="submit"]').click();

    // Supabase returns an auth error; the form should surface it
    const errorMsg = page.locator('[role="alert"], .text-red-600, .text-red-500, p:has-text("Invalid")');
    await expect(errorMsg.first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows a forgot-password link', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.getByRole('link', { name: /forgot|reset/i });
    await expect(forgotLink).toBeVisible();
  });
});
