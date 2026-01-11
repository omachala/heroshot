import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  plugins: [
    tailwindcss(),
    svelte({
      compilerOptions: {
        css: 'injected',
      },
    }),
  ],
  test: {
    name: 'e2e',
    include: ['tests/**/*.test.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
    },
    testTimeout: 30000,
  },
});
