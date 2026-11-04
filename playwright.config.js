// Optional local verification reuses Card Workshop's approved Chrome harness.
// The learning app itself has no dependency on the parent repository.
import { defineConfig } from '@playwright/test';
import { chromeTestUseOptions } from '../../tests/browser/chrome.ts';
export default defineConfig({
  testDir: './tests',
  testMatch: 'browser.spec.js',
  outputDir: './.artifacts/browser',
  globalSetup: '../../tests/browser/startup.ts',
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: 'list',
  use: {
    ...chromeTestUseOptions(),
    headless: true,
    screenshot: 'only-on-failure',
    baseURL: 'http://127.0.0.1:4178',
    viewport: { width: 1440, height: 1080 },
  },
});
