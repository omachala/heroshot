import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/toolbar.ts'),
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
      },
    },
  },
  css: {
    // Inline CSS into JS bundle
    postcss: {},
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: '../coverage/toolbar',
      include: ['src/**/*.ts'],
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
