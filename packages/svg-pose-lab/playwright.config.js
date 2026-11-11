import { defineConfig } from '@playwright/test';
import { browserBudget } from '../../tests/browser/budget.ts';
import { chromeTestUseOptions } from '../../tests/browser/chrome.ts';

export default defineConfig({
  testDir: './tests',
  testMatch: 'browser.spec.js',
  outputDir: '../../test-results/browser/svg-pose-lab',
  globalSetup: '../../tests/browser/startup.ts',
  workers: 1,
  retries: 0,
  timeout: browserBudget(30_000),
  expect: { timeout: browserBudget(5_000) },
  reporter: 'list',
  use: {
    ...chromeTestUseOptions(),
    headless: true,
    viewport: { width: 1280, height: 900 },
    screenshot: 'only-on-failure',
  },
});
