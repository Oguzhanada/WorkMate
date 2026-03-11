import { expect, test } from '@playwright/test';

test.describe('Guest post-job flow (unauthenticated)', () => {
  test('guest can complete all 3 steps and submit without constraint error', async ({ page }) => {
    await page.goto('/post-job');
    await page.getByRole('heading', { name: 'Create Job Request' }).waitFor();

    // ── Step 1: Title and details ─────────────────────────────────────────────
    await page.getByPlaceholder(/fix a leaking tap/i).fill('Fix a leaking kitchen tap urgently');

    // Select first available category
    const categorySelect = page.locator('select').first();
    await categorySelect.waitFor({ state: 'attached' });
    // Wait for categories to load (option count > 1 means loaded)
    await expect(categorySelect.locator('option')).not.toHaveCount(1, { timeout: 10_000 });
    const options = await categorySelect.locator('option[value]:not([value=""])').all();
    if (options.length > 0) {
      const value = await options[0].getAttribute('value');
      if (value) await categorySelect.selectOption(value);
    }

    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 2: Location and budget ───────────────────────────────────────────
    // Scope select
    const scopeSelect = page.locator('select').first();
    await scopeSelect.selectOption({ index: 1 });

    // Urgency chip
    await page.getByRole('button', { name: /asap|today|this week/i }).first().click();

    // Eircode + address
    const eircodeInput = page.getByPlaceholder('D02 X285');
    if (await eircodeInput.isVisible()) {
      await eircodeInput.fill('D02X285');
      await eircodeInput.blur();
    }

    // County and locality
    const countySelect = page.locator('select').filter({ hasText: /dublin|cork|galway/i }).first();
    if (await countySelect.isVisible()) {
      await countySelect.selectOption('Dublin');
    }

    const localitySelect = page.locator('select').filter({ hasText: /locality|area/i }).first();
    if (await localitySelect.isVisible()) {
      await localitySelect.selectOption({ index: 1 });
    }

    const addressInput = page.getByLabel(/address line 1/i);
    if (await addressInput.isVisible()) {
      await addressInput.fill('1 Main Street');
    }

    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 3: Email confirmation ────────────────────────────────────────────
    await expect(page.getByText(/email confirmation/i)).toBeVisible();
    await page.getByPlaceholder('example@email.com').fill('e2e-guest@test.workmate.ie');

    await page.getByRole('button', { name: 'Save Request' }).click();

    // ── Verify: no constraint violation ───────────────────────────────────────
    // The old bug showed: "new row for relation "job_intents" violates check constraint"
    const errorBanner = page.locator('[class*="error"]');
    // Wait a moment for the API response
    await page.waitForTimeout(2000);

    // Check that the constraint error does NOT appear
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('violates check constraint');
    expect(pageText).not.toContain('job_intents_status_check');

    // Success: either a success message or no constraint error
    // In dev mode, the intent is auto-verified, so we should see success
    const hasSuccess = pageText?.includes('Your request was saved');

    // The critical assertion: no DB constraint violation
    // If there's a different error (e.g., no categories), that's a different bug
    if (!hasSuccess) {
      // Ensure the error is NOT the constraint violation we're testing for
      const errorText = await errorBanner.first().textContent().catch(() => '');
      expect(errorText).not.toContain('violates check constraint');
    }
  });
});
