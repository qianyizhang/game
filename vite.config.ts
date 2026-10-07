import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Geometry construction is CPU-heavy: measured ~5.4 seconds for Banner Bearer alone.
    // Bound concurrency instead of oversubscribing every core with sculpting jobs.
    maxWorkers: 2,
    projects: [
      {
        extends: true,
        test: {
          name: 'application',
          include: ['src/**/*.test.ts'],
          exclude: ['src/art3d/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'geometry',
          include: ['src/art3d/**/*.test.ts'],
          testTimeout: 15_000,
        },
      },
    ],
  },
});
