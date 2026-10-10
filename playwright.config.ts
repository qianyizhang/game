import { defineConfig } from '@playwright/test';
import { browserBudget } from './tests/browser/budget';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './test-results/browser',
  globalSetup: './tests/browser/startup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Emit the first hosted failure and its artifacts before repeating the same fault.
  maxFailures: process.env.CI ? 1 : undefined,
  timeout: browserBudget(30_000),
  expect: { timeout: browserBudget(5_000) },
  reporter: 'list',
  projects: [
    { name: 'functional', testIgnore: '**/art3d-review.spec.ts' },
    {
      name: 'visual-review',
      testMatch: '**/art3d-review.spec.ts',
      timeout: browserBudget(120_000),
    },
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 1080 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
