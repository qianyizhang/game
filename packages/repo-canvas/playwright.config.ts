import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './src/ui',
  testMatch: '**/*.spec.ts',
  outputDir: '../../test-results/repo-canvas',
  globalSetup: '../../tests/browser/startup.ts',
  workers: 1,
  retries: 0,
  timeout: 45000,
  use: {
    baseURL: 'http://127.0.0.1:4318',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node src/server/browser-fixture.ts',
    cwd: import.meta.dirname,
    url: 'http://127.0.0.1:4318',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
