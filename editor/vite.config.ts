import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  plugins: [
    tailwindcss(),
    svelte({
      compilerOptions: {
        // Generate JS that works without Svelte runtime
        css: 'injected',
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname!, 'src/main.ts'),
      name: 'HeroshotEditor',
      formats: ['iife'],
      fileName: () => 'editor.js',
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
      reportsDirectory: '../coverage/editor',
      // Only cover src/lib - Svelte components are tested via e2e
      include: ['src/lib/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/lib/tests/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
