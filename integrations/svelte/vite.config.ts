/// <reference types="vitest" />
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { heroshot } from '../shared/vitePlugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    heroshot(), // Provides empty manifest for tests
    dts({
      include: ['src/index.ts', 'src/components/**/*.svelte'],
      exclude: ['src/**/*.test.ts'],
      outDir: '../../dist/integrations/svelte',
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    outDir: '../../dist/integrations/svelte',
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {
      external: ['svelte', 'svelte/internal', 'svelte/store'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
