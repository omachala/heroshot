import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/demo/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',

  // Snapshot configuration for visual regression testing
  snapshotDir: './tests/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',

  // Update snapshots with: npx playwright test --update-snapshots
  updateSnapshots: 'none',

  // Skip visual regression on CI (Docker container renders fonts differently than host)
  ignoreSnapshots: !!process.env.CI,

  use: {
    baseURL: 'https://heroshot.dev',
    trace: 'on-first-retry',
  },

  expect: {
    // Visual comparison settings - strict but allow 2% for minor rendering variations
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.1,
    },
    toMatchSnapshot: {
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
