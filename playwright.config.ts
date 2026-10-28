import { defineConfig } from '@playwright/test';
import { browserBudget } from './tests/browser/budget.ts';
import { fullBrowserFiles } from './packages/workshop-tools/ci/selection.ts';
import { chromeTestUseOptions } from './tests/browser/chrome.ts';

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
    {
      name: 'smoke',
      testMatch: [
        '**/workshop.spec.ts',
        '**/spire.spec.ts',
        '**/battlegrounds.spec.ts',
        '**/diablo2.spec.ts',
        '**/cartographer.spec.ts',
        '**/cartographer-cues.spec.ts',
      ],
      grep: /@smoke/,
    },
    {
      name: 'ci-games',
      testIgnore: [
        ...fullBrowserFiles.map((path) => `**/${path.split('/').at(-1)}`),
        '**/art3d.spec.ts',
        '**/art3d-review.spec.ts',
        '**/trace-private.spec.ts',
      ],
      grepInvert: /@requires-blender|@smoke/,
    },
    {
      name: 'ci-assets',
      testMatch: '**/art3d.spec.ts',
      grep: /@asset-smoke/,
    },
    {
      name: 'functional',
      testIgnore: ['**/art3d-review.spec.ts', '**/trace-private.spec.ts'],
      grepInvert: /@requires-blender/,
    },
    {
      name: 'requires-blender',
      testMatch: [
        '**/canid.spec.ts',
        '**/fox.spec.ts',
        '**/boar.spec.ts',
        '**/raven.spec.ts',
        '**/otter.spec.ts',
        '**/night-passage-hero.spec.ts',
        '**/night-passage-enemies.spec.ts',
        '**/night-passage-guardian.spec.ts',
        '**/night-passage-environment.spec.ts',
        '**/dcc-workbench.spec.ts',
        '**/native-assets.spec.ts',
      ],
      grep: /@requires-blender/,
    },
    {
      name: 'requires-private-evidence',
      testMatch: '**/trace-private.spec.ts',
    },
    {
      name: 'visual-review',
      testMatch: '**/art3d-review.spec.ts',
      timeout: browserBudget(120_000),
    },
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...chromeTestUseOptions(),
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
