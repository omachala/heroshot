import { defineConfig, devices } from 'playwright/test';

/**
 * Playwright config for demo screenshot tests.
 * These tests capture screenshots of the editor for documentation.
 * Run via: pnpm test:editor:demo
 */
export default defineConfig({
  testDir: './tests/demo',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',

  // Snapshot configuration
  snapshotDir: './tests/demo/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',

  // Always update snapshots in CI (workflow commits them back)
  updateSnapshots: process.env.CI ? 'all' : 'none',

  use: {
    baseURL: 'https://heroshot.sh',
    trace: 'on-first-retry',
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.1,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
