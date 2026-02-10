import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  webServer: {
    command: 'npm run dev -- --port 4175',
    port: 4175,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4175',
  },
});
