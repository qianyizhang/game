import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { dccAssetsPlugin } from './packages/dcc-workbench/vite-assets.ts';

export default defineConfig({
  plugins: [react(), dccAssetsPlugin()],
  test: {
    // Geometry construction is CPU-heavy: measured ~5.4 seconds for Banner Bearer alone.
    // Bound concurrency instead of oversubscribing every core with sculpting jobs.
    maxWorkers: 2,
    projects: [
      {
        extends: true,
        test: {
          name: 'application',
          include: ['src/**/*.test.ts', 'packages/diablo2/src/**/*.test.ts'],
          exclude: ['src/art3d/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'geometry',
          include: ['src/art3d/**/*.test.ts'],
          // The hosted runner takes ~3.2x the local geometry runtime (495s vs 155s).
          testTimeout: process.env.CI ? 60_000 : 15_000,
        },
      },
    ],
  },
});
