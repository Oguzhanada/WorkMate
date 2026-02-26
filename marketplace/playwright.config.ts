import {defineConfig, devices} from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3001);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const useExternalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 7_000
  },
  reporter: [
    ['list'],
    ['html', {open: 'never'}]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: useExternalServer
    ? undefined
    : {
        command: `npm run dev -- --port ${port}`,
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI
      },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']}
    },
    {
      name: 'mobile-chrome',
      use: {...devices['Pixel 7']}
    }
  ]
});
