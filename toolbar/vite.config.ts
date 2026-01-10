import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  plugins: [
    svelte({
      compilerOptions: {
        // Generate JS that works without Svelte runtime
        css: 'injected',
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'HeroshotToolbar',
      formats: ['iife'],
      fileName: () => 'toolbar.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      output: {
        // Ensure the IIFE is self-executing
        extend: true,
        // Inline all dynamic imports
        inlineDynamicImports: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: '../coverage/toolbar',
      include: ['src/**/*.ts', 'src/**/*.svelte'],
      exclude: ['src/**/*.d.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
