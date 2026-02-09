/// <reference types="vitest" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { heroshot } from '../shared/vitePlugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    heroshot(), // Provides empty manifest for tests
  ],
  build: {
    lib: {
      entry: resolve(__dirname, '../shared/index.ts'),
      formats: ['es'],
      fileName: 'shared',
    },
    outDir: '../../dist/integrations/svelte',
    emptyOutDir: true,
    copyPublicDir: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
