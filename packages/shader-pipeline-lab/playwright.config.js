// This separate frontend shares the repository runtime and approved Chrome harness.
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { chromeTestUseOptions } from '../../tests/browser/chrome.ts';
export default defineConfig({
  testDir: './tests',
  testMatch: 'browser.spec.js',
  outputDir: '../../test-results/browser/shader-lab',
  globalSetup: '../../tests/browser/startup.ts',
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: 'list',
  webServer: {
    command: 'node packages/shader-pipeline-lab/server.js',
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    env: { PORT: '4179' },
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: false,
    timeout: 15_000,
  },
  use: {
    ...chromeTestUseOptions(),
    headless: true,
    screenshot: 'only-on-failure',
    baseURL: 'http://127.0.0.1:4179',
    viewport: { width: 1440, height: 1080 },
  },
});
